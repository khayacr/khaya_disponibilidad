#!/usr/bin/env bash
# Crea .venv en la raíz del repo y instala backend/requirements.txt.
# Prueba python3.11, luego 3.12, luego python3 (p. ej. 3.14 en macOS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pick_python() {
  for bin in python3.11 python3.12 python3.13 python3; do
    if command -v "$bin" &>/dev/null; then
      echo "$bin"
      return 0
    fi
  done
  echo ""
}

BIN="$(pick_python)"
if [[ -z "$BIN" ]]; then
  echo "No se encontró python3 en el PATH."
  exit 1
fi

FULL="$(command -v "$BIN")"
echo "Intérprete: $FULL ($($BIN --version 2>&1))"
echo "Creando .venv en $ROOT ..."
rm -rf .venv
"$BIN" -m venv .venv
.venv/bin/pip install -U pip setuptools wheel
.venv/bin/pip install -r backend/requirements.txt
echo ""
echo "Listo. Arranca el API con:"
echo "  $ROOT/backend/start_dev.sh"
