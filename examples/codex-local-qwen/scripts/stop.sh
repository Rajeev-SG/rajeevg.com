#!/bin/zsh
set -eu

KIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$KIT_ROOT/run"

stop_one() {
  local name="$1"
  local pattern="$2"
  local pid_file="$RUN_DIR/$name.pid"
  [ -f "$pid_file" ] || return 0
  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" 2>/dev/null; then
    local command_line
    command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$command_line" == *"$pattern"* ]]; then
      kill "$pid"
      echo "Stopped $name ($pid)."
    else
      echo "Did not stop $pid: its command no longer matches $pattern." >&2
    fi
  fi
  rm -f "$pid_file"
}

stop_one adapter "adapter.py"
stop_one cliproxyapi "cliproxy"
stop_one mlx-vlm "mlx_vlm.server"
