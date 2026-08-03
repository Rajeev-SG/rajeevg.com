#!/bin/zsh
set -eu

KIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$KIT_ROOT/run"

for name in mlx-vlm cliproxyapi adapter; do
  pid_file="$RUN_DIR/$name.pid"
  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name: running (PID $(cat "$pid_file"))"
  else
    echo "$name: stopped"
  fi
done

echo "Health:"
curl -fsS --max-time 3 http://127.0.0.1:8080/health || true
echo
