Nombres para la cotización PDF (prioridad alta), alineados con `PLANTA_*_SHARED_LAYOUTS` en `floorPlanLayout.js`:

Planta baja (piso 1), por modelo compartido:
  planta_baja_3-5-7.png
  planta_baja_2-8.png
  planta_baja_1-9.png
  planta_baja_4-6.png

Planta tipo (pisos 2–14), por modelo compartido:
  planta_tipo_2-8-10.png
  planta_tipo_3-5-7.png
  planta_tipo_1-9.png
  planta_tipo_4-6.png

Fallback (si no hay grupo): planta_baja_{piso}-{apto}.png, planta_baja_apto_{n}.png, planta_tipo_apto_{n}.png, y rutas por código de unidad.

Si un apartamento encaja en varios grupos, se prueba primero el grupo con más unidades (más específico).

El PDF valida `Content-Type: image/*` al cargar el PNG (evita index.html del dev server).
