#!/usr/bin/env bash
set -e

echo "==> Building React frontend..."
cd frontend
# Registry 500s are transient; retry + long timeout helps CI (e.g. Render).
yarn_install_with_retry() {
  local n=0
  until yarn install --frozen-lockfile --network-timeout 300000; do
    n=$((n + 1))
    if [ "$n" -ge 4 ]; then
      echo "yarn install failed after $n attempts" >&2
      return 1
    fi
    echo "yarn install failed (attempt $n), retrying in 15s..." >&2
    sleep 15
  done
}
yarn_install_with_retry
# Evita OOM en hosts con poca RAM (p. ej. build en Render)
export NODE_OPTIONS="--max-old-space-size=4096"
REACT_APP_BACKEND_URL="" yarn build
cd ..

echo "==> Copying frontend build to backend/static/..."
mkdir -p backend/static
cp -r frontend/build/. backend/static/

echo "==> Installing Python dependencies..."
PYTHON_CMD="$(command -v python3 2>/dev/null || command -v python 2>/dev/null || true)"
if [ -z "$PYTHON_CMD" ]; then
  echo "python3/python not found in PATH" >&2
  exit 1
fi
# `pip` suelto a veces falta; `python -m pip` funciona en Render y en macOS con python3
"$PYTHON_CMD" -m pip install --upgrade pip setuptools wheel
"$PYTHON_CMD" -m pip install -r backend/requirements.txt

echo "==> Build complete."
