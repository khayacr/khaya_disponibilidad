#!/usr/bin/env bash
# Arranca uvicorn SIEMPRE con .venv/bin/python (nunca uses "uvicorn" suelto: puede ser el de Python 3.14 del sistema).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
REQ="$ROOT/backend/requirements.txt"
PY="$ROOT/.venv/bin/python"
cd "$HERE"

if [[ ! -x "$PY" ]]; then
  echo "No existe $PY (el venv no se creó o lo borraste sin recrearlo)."
  echo ""
  echo "Si NO tienes python3.11 en el Mac, no uses python3.11 -m venv. Ejecuta:"
  echo "  $ROOT/backend/bootstrap_venv.sh"
  echo ""
  echo "O a mano con el python que sí tengas (python3 --version):"
  echo "  cd $ROOT && rm -rf .venv && python3 -m venv .venv"
  echo "  .venv/bin/pip install -U pip setuptools wheel && .venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

# El requirements correcto tiene ~15 líneas y empieza con comentarios + fastapi. El viejo tenía 126 líneas y rompía pip.
REQ_LINES=$(wc -l < "$REQ" | tr -d ' ')
if [[ "$REQ_LINES" -gt 40 ]]; then
  echo "ERROR: backend/requirements.txt tiene $REQ_LINES líneas (es el archivo VIEJO con conflictos)."
  echo "  git pull origin main"
  echo "  (o copia el requirements corto desde el repo en GitHub)"
  exit 1
fi

if ! "$PY" -c "import gspread" 2>/dev/null; then
  echo "gspread no está instalado en: $($PY -c 'import sys; print(sys.executable)')"
  echo "Instala con el requirements corto:"
  echo "  $PY -m pip install -r $REQ"
  exit 1
fi

exec "$PY" -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
