Nombres para la cotización PDF (prioridad alta):

Planta baja (piso 1):
  - Por grupos (ver PLANTA_BAJA_SHARED_LAYOUTS en floorPlanLayout.js):
    planta_baja_1-8.png, planta_baja_2-9.png, planta_baja_3-5-7.png, planta_baja_4-7.png
  - Fallback: planta_baja_1-{apto}.png, planta_baja_apto_{n}.png

Planta tipo (pisos 2–14):
  - Por grupos (PLANTA_TIPO_SHARED_LAYOUTS): planta_tipo_2-9-10.png, planta_tipo_1-8.png, etc.
  - Fallback: planta_tipo_apto_{n}.png

Si un apartamento encaja en varios grupos, se prueba primero el grupo con más apartamentos (más específico).

Si el PDF seguía mostrando la planta general: el dev server devolvía index.html en lugar del PNG; ya se valida que la respuesta sea imagen real.
