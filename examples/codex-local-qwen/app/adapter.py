#!/usr/bin/env python3
"""Route Codex Responses requests to local Qwen or CLIProxyAPI.

This file uses only Python's standard library. It also contains the temporary
normalisation for image-valued tool results described in MLX-VLM issue #1760.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(
    os.environ.get(
        "CODEX_LOCAL_QWEN_HOME",
        str(Path.home() / ".local" / "share" / "codex-local-qwen"),
    )
)
SETTINGS = ROOT / "config" / "settings.json"
LOCAL_KEY = os.environ.get("CODEX_LOCAL_ROUTER_KEY", "sk-local-codex")
QWEN_ALIAS = os.environ.get("CODEX_LOCAL_QWEN_ALIAS", "qwen3.6-35b-a3b-mlx")
MLX_RESPONSES = os.environ.get(
    "CODEX_LOCAL_MLX_RESPONSES", "http://127.0.0.1:8081/v1/responses"
)
CLIPROXY_BASE = os.environ.get(
    "CODEX_LOCAL_CLIPROXY_BASE", "http://127.0.0.1:8319"
)
LOG = logging.getLogger("codex-local-qwen-router")


def text_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts = []
    for item in content:
        if isinstance(item, dict) and item.get("type") in (
            "input_text",
            "output_text",
            "text",
        ):
            parts.append(str(item.get("text") or ""))
    return "\n".join(part for part in parts if part)


def flattened_name(namespace: str, name: str) -> str:
    candidate = f"{namespace}__{name}"
    if len(candidate) <= 128:
        return candidate
    digest = hashlib.sha256(candidate.encode()).hexdigest()[:12]
    return f"{candidate[:113]}__{digest}"


def requested_namespaces(payload: dict[str, Any]) -> set[str]:
    """Send Qwen the connected-tool groups relevant to the latest request."""
    raw_input = payload.get("input")
    user_parts = []
    if isinstance(raw_input, str):
        user_parts.append(raw_input)
    elif isinstance(raw_input, list):
        for item in raw_input:
            if isinstance(item, dict) and item.get("role") == "user":
                user_parts.append(text_content(item.get("content")))
    request_text = (user_parts[-1] if user_parts else "").lower()
    selected = {"mcp__brave", "image_gen"}
    keywords = {
        "mcp__codex_apps__google_drive": (
            "google drive",
            "google doc",
            "google sheet",
            "google slide",
            "spreadsheet",
        ),
        "mcp__codex_apps__notion": ("notion",),
        "mcp__codex_apps__github": (
            "connected github",
            "my github",
            "use github tool",
            "github app",
            "pull request",
        ),
        "mcp__context7": ("context7", "library documentation", "api documentation"),
        "mcp__probe": ("probe", "semantic code search"),
        "mcp__qmd": ("qmd", "markdown index"),
        "mcp__draw_io": ("draw.io", "drawio"),
        "mcp__analytics_mcp": ("google analytics", "analytics report"),
        "mcp__peekaboo": ("peekaboo", "control my mac", "mac screen"),
    }
    for namespace, terms in keywords.items():
        if namespace.lower() in request_text or any(
            term in request_text for term in terms
        ):
            selected.add(namespace)
    return selected


def normalize_tool_image_output(item: dict[str, Any]) -> list[dict[str, Any]]:
    """Keep an image returned by a tool as visual input, not base64 text."""
    if item.get("type") not in (
        "function_call_output",
        "shell_call_output",
        "apply_patch_call_output",
        "tool_result",
    ):
        return [item]
    output_key = "output" if "output" in item else "content"
    output = item.get(output_key)
    if not isinstance(output, list):
        return [item]

    text_parts = []
    remaining_parts = []
    image_parts = []
    for part in output:
        if not isinstance(part, dict):
            remaining_parts.append(part)
            continue
        part_type = part.get("type")
        if part_type in ("input_text", "output_text", "text"):
            text_parts.append(str(part.get("text") or ""))
        elif part_type in ("input_image", "image_url"):
            image_parts.append(part)
        else:
            remaining_parts.append(part)
    if not image_parts:
        return [item]

    if remaining_parts:
        text_parts.append(json.dumps(remaining_parts, ensure_ascii=False))
    normalized_item = dict(item)
    normalized_item[output_key] = (
        "\n".join(part for part in text_parts if part.strip())
        or "[Image output attached]"
    )
    LOG.info(
        "converted image-valued tool output call_id=%s images=%d text_chars=%d",
        item.get("call_id") or item.get("tool_call_id"),
        len(image_parts),
        len(normalized_item[output_key]),
    )
    return [
        normalized_item,
        {"type": "message", "role": "user", "content": image_parts},
    ]


def normalize_qwen_payload(
    payload: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, tuple[str, str]]]:
    raw_input = payload.get("input")
    selected_namespaces = requested_namespaces(payload)
    instructions = [str(payload.get("instructions") or "").strip()]
    normalized: Any = [] if isinstance(raw_input, list) else raw_input

    for item in raw_input if isinstance(raw_input, list) else []:
        if not isinstance(item, dict):
            normalized.append(item)
            continue
        expanded_items = normalize_tool_image_output(item)
        if len(expanded_items) > 1:
            normalized.extend(expanded_items)
            continue
        role = item.get("role")
        if item.get("type") in (None, "message") and role in (
            "developer",
            "system",
        ):
            content = text_content(item.get("content"))
            if content:
                instructions.append(content)
            continue
        normalized.append(item)

    payload["input"] = normalized
    combined = "\n\n".join(part for part in instructions if part)
    if combined:
        payload["instructions"] = combined

    tool_map: dict[str, tuple[str, str]] = {}
    normalized_tools = []
    for tool in payload.get("tools", []):
        if not isinstance(tool, dict):
            continue
        nested = tool.get("tools")
        if tool.get("type") == "namespace" and isinstance(nested, list):
            namespace = str(tool.get("name") or "namespace")
            if namespace not in selected_namespaces:
                continue
            for item in nested:
                if not isinstance(item, dict) or not item.get("name"):
                    continue
                name = str(item["name"])
                flat = flattened_name(namespace, name)
                tool_map[flat] = (namespace, name)
                normalized_tools.append(
                    {
                        "type": "function",
                        "name": flat,
                        "description": item.get("description")
                        or f"{name} from {namespace}",
                        "parameters": item.get("parameters")
                        or item.get("input_schema")
                        or item.get("inputSchema")
                        or {"type": "object", "properties": {}},
                    }
                )
        elif tool.get("type") in ("function", "shell", "apply_patch"):
            normalized_tools.append(tool)
    payload["tools"] = normalized_tools
    return payload, tool_map


def restore_namespaces(value: Any, tool_map: dict[str, tuple[str, str]]) -> Any:
    if isinstance(value, list):
        return [restore_namespaces(item, tool_map) for item in value]
    if not isinstance(value, dict):
        return value
    restored = {
        key: restore_namespaces(item, tool_map) for key, item in value.items()
    }
    if (
        restored.get("type") == "function_call"
        or str(restored.get("type") or "").startswith(
            "response.function_call_arguments"
        )
    ) and restored.get("name") in tool_map:
        namespace, name = tool_map[restored["name"]]
        restored["namespace"] = namespace
        restored["name"] = name
    return restored


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "codex-local-qwen-router/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        LOG.info("%s - %s", self.address_string(), fmt % args)

    def json_response(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True

    def require_auth(self) -> bool:
        if self.headers.get("Authorization") == f"Bearer {LOCAL_KEY}":
            return True
        self.json_response(
            HTTPStatus.UNAUTHORIZED,
            {
                "error": {
                    "message": "Invalid local router key",
                    "type": "authentication_error",
                }
            },
        )
        return False

    def proxy(
        self,
        url: str,
        body: bytes | None = None,
        *,
        cliproxy: bool = False,
        tool_map: dict[str, tuple[str, str]] | None = None,
    ) -> None:
        headers = {"Accept": self.headers.get("Accept", "application/json")}
        if body is not None:
            headers["Content-Type"] = self.headers.get(
                "Content-Type", "application/json"
            )
        if cliproxy:
            headers["Authorization"] = f"Bearer {LOCAL_KEY}"
        request = urllib.request.Request(
            url, data=body, headers=headers, method=self.command
        )
        try:
            with urllib.request.urlopen(request, timeout=900) as upstream:
                content_type = upstream.headers.get(
                    "Content-Type", "application/json"
                )
                self.send_response(upstream.status)
                self.send_header("Content-Type", content_type)
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "close")
                self.end_headers()
                if tool_map and "text/event-stream" in content_type:
                    for line in upstream:
                        if line.startswith(b"data: "):
                            try:
                                event = json.loads(line[6:])
                                line = (
                                    b"data: "
                                    + json.dumps(
                                        restore_namespaces(event, tool_map),
                                        separators=(",", ":"),
                                    ).encode()
                                    + b"\n"
                                )
                            except (json.JSONDecodeError, UnicodeDecodeError):
                                pass
                        self.wfile.write(line)
                        self.wfile.flush()
                elif tool_map:
                    response_body = upstream.read()
                    try:
                        response_body = json.dumps(
                            restore_namespaces(
                                json.loads(response_body), tool_map
                            ),
                            separators=(",", ":"),
                        ).encode()
                    except json.JSONDecodeError:
                        pass
                    self.wfile.write(response_body)
                    self.wfile.flush()
                else:
                    while chunk := upstream.read(65536):
                        self.wfile.write(chunk)
                        self.wfile.flush()
        except urllib.error.HTTPError as error:
            error_body = error.read()
            self.send_response(error.code)
            self.send_header(
                "Content-Type",
                error.headers.get("Content-Type", "application/json"),
            )
            self.send_header("Content-Length", str(len(error_body)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(error_body)
        except (BrokenPipeError, ConnectionResetError):
            LOG.info("Client disconnected while an upstream response streamed")
        except Exception as error:
            LOG.exception("Upstream request failed")
            if not self.wfile.closed:
                self.json_response(
                    HTTPStatus.BAD_GATEWAY,
                    {
                        "error": {
                            "message": str(error),
                            "type": "upstream_error",
                        }
                    },
                )
        finally:
            self.close_connection = True

    def do_GET(self) -> None:
        if self.path == "/health":
            checks: dict[str, bool] = {}
            for name, url, cliproxy in (
                ("mlx_vlm", "http://127.0.0.1:8081/v1/models", False),
                ("cliproxyapi", f"{CLIPROXY_BASE}/v1/models", True),
            ):
                headers = (
                    {"Authorization": f"Bearer {LOCAL_KEY}"}
                    if cliproxy
                    else {}
                )
                try:
                    request = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(request, timeout=3) as response:
                        checks[name] = response.status == 200
                except Exception:
                    checks[name] = False
            status = (
                HTTPStatus.OK
                if all(checks.values())
                else HTTPStatus.SERVICE_UNAVAILABLE
            )
            self.json_response(
                status,
                {
                    "status": "ok" if status == 200 else "starting",
                    **checks,
                },
            )
            return
        if self.path in ("/v1/models", "/models"):
            if self.require_auth():
                self.proxy(f"{CLIPROXY_BASE}/v1/models", cliproxy=True)
            return
        self.json_response(
            HTTPStatus.NOT_FOUND, {"error": {"message": "Not found"}}
        )

    def do_POST(self) -> None:
        if not self.require_auth():
            return
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.json_response(
                HTTPStatus.BAD_REQUEST, {"error": {"message": "Invalid JSON"}}
            )
            return

        model = str(payload.get("model") or "")
        if model == QWEN_ALIAS:
            settings = json.loads(SETTINGS.read_text(encoding="utf-8"))
            payload["model"] = settings["model_path"]
            payload, tool_map = normalize_qwen_payload(payload)
            target = MLX_RESPONSES
            cliproxy = False
            route = "mlx_vlm"
        else:
            target = f"{CLIPROXY_BASE}{self.path}"
            cliproxy = True
            tool_map = None
            route = "cliproxyapi"
        LOG.info(
            "route=%s model=%s path=%s stream=%s",
            route,
            model,
            self.path,
            payload.get("stream"),
        )
        self.proxy(
            target,
            json.dumps(payload, separators=(",", ":")).encode(),
            cliproxy=cliproxy,
            tool_map=tool_map,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.daemon_threads = True
    LOG.info("Local router listening on http://%s:%s", args.host, args.port)
    server.serve_forever(poll_interval=0.25)


if __name__ == "__main__":
    main()
