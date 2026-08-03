#!/bin/zsh
set -eu

KIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$KIT_ROOT/run"
LOG_DIR="$KIT_ROOT/logs"
SETTINGS="$KIT_ROOT/config/settings.json"
CLIPROXY_CONFIG="$KIT_ROOT/config/cliproxyapi.yaml"

mkdir -p "$RUN_DIR" "$LOG_DIR"

for required in jq mlx_vlm.server uv curl; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Missing command: $required" >&2
    exit 1
  fi
done

if command -v cliproxyapi >/dev/null 2>&1; then
  CLIPROXY_BIN="$(command -v cliproxyapi)"
elif command -v cli-proxy-api >/dev/null 2>&1; then
  CLIPROXY_BIN="$(command -v cli-proxy-api)"
else
  echo "Missing CLIProxyAPI. Install it with: brew install cliproxyapi" >&2
  exit 1
fi

if [ ! -f "$SETTINGS" ] || [ ! -f "$CLIPROXY_CONFIG" ]; then
  echo "Copy the two example config files and edit settings.json first." >&2
  exit 1
fi

MODEL_PATH="$(jq -r '.model_path' "$SETTINGS")"
MODEL_ALIAS="$(jq -r '.model_alias' "$SETTINGS")"
MAX_OUTPUT="$(jq -r '.max_output_tokens' "$SETTINGS")"
CONTEXT_LENGTH="$(jq -r '.context_length' "$SETTINGS")"

if [ ! -f "$MODEL_PATH/config.json" ]; then
  echo "No model config found at $MODEL_PATH/config.json" >&2
  exit 1
fi

if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1 || \
   lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1 || \
   lsof -nP -iTCP:8319 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "One of ports 8080, 8081, or 8319 is already in use." >&2
  lsof -nP -iTCP:8080 -iTCP:8081 -iTCP:8319 -sTCP:LISTEN >&2 || true
  exit 1
fi

HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 nohup mlx_vlm.server \
  --model "$MODEL_PATH" \
  --host 127.0.0.1 \
  --port 8081 \
  --max-tokens "$MAX_OUTPUT" \
  --max-kv-size "$CONTEXT_LENGTH" \
  --kv-bits 8 \
  --kv-quant-scheme uniform \
  --vision-cache-size 8 \
  --log-level INFO \
  >"$LOG_DIR/mlx-vlm.log" 2>&1 &
echo $! >"$RUN_DIR/mlx-vlm.pid"

for _ in {1..900}; do
  if curl -fsS --max-time 3 http://127.0.0.1:8081/v1/models >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -fsS --max-time 3 http://127.0.0.1:8081/v1/models >/dev/null 2>&1; then
  echo "MLX-VLM did not become ready. Check $LOG_DIR/mlx-vlm.log" >&2
  "$KIT_ROOT/scripts/stop.sh" || true
  exit 1
fi

nohup "$CLIPROXY_BIN" --config "$CLIPROXY_CONFIG" \
  >"$LOG_DIR/cliproxyapi.log" 2>&1 &
echo $! >"$RUN_DIR/cliproxyapi.pid"

for _ in {1..60}; do
  if curl -fsS --max-time 3 \
    -H 'Authorization: Bearer sk-local-codex' \
    http://127.0.0.1:8319/v1/models >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -fsS --max-time 3 \
  -H 'Authorization: Bearer sk-local-codex' \
  http://127.0.0.1:8319/v1/models >/dev/null 2>&1; then
  echo "CLIProxyAPI did not become ready. Check $LOG_DIR/cliproxyapi.log" >&2
  "$KIT_ROOT/scripts/stop.sh" || true
  exit 1
fi

CODEX_LOCAL_QWEN_HOME="$KIT_ROOT" \
CODEX_LOCAL_QWEN_ALIAS="$MODEL_ALIAS" \
nohup uv run --python 3.13 --no-project \
  python "$KIT_ROOT/app/adapter.py" --host 127.0.0.1 --port 8080 \
  >"$LOG_DIR/adapter.log" 2>&1 &
echo $! >"$RUN_DIR/adapter.pid"

for _ in {1..60}; do
  if curl -fsS --max-time 3 http://127.0.0.1:8080/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! curl -fsS --max-time 3 http://127.0.0.1:8080/health >/dev/null 2>&1; then
  echo "The Codex adapter did not become ready. Check $LOG_DIR/adapter.log" >&2
  "$KIT_ROOT/scripts/stop.sh" || true
  exit 1
fi

echo "Local Qwen route is ready at http://127.0.0.1:8080/v1"
echo "Model alias: $MODEL_ALIAS"
curl -fsS http://127.0.0.1:8080/health
echo
