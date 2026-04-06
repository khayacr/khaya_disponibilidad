# Cambiar estado desde la app (escritura en Google Sheets)

La app **lee** la hoja sin credenciales (export público XLSX). Para **guardar el estado** desde la interfaz hace falta que el backend pueda escribir en la hoja vía API.

Necesitas **dos cosas** en el servidor donde corre `uvicorn` (local o Render):

1. **Python con `gspread` instalado** (ya está en `backend/requirements.txt`).
2. **Variable `GOOGLE_CREDENTIALS_JSON`** con el JSON de una **cuenta de servicio** de Google, y la hoja compartida con el email de esa cuenta.

---

## A) Google Cloud (cuenta de servicio)

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto (o usa uno existente).
2. Menú **APIs y servicios** → **Biblioteca** → busca **Google Sheets API** → **Habilitar**.
3. Menú **IAM y administración** → **Cuentas de servicio** → **Crear cuenta de servicio** (nombre libre, rol no hace falta para Sheets si compartes la hoja).
4. En la cuenta creada → pestaña **Claves** → **Agregar clave** → **JSON** → se descarga un archivo `.json`.

Ese archivo es **secreto**: no lo subas a Git.

5. Abre el JSON y copia el campo **`client_email`** (termina en `@...iam.gserviceaccount.com`). Lo usarás en el paso B.

---

## B) Compartir la hoja de cálculo

1. Abre la hoja en Google Sheets (la que usa tu app, `SPREADSHEET_ID` si la cambiaste).
2. **Compartir** → añade el **`client_email`** del JSON → permiso **Editor** → Enviar.

Sin esto, la API devolverá permiso denegado aunque el JSON esté bien.

---

## C) Variable de entorno `GOOGLE_CREDENTIALS_JSON`

El valor debe ser **el contenido completo del JSON** (texto válido desde `{` hasta `}`).

**Importante en Render:** en `render.yaml` la clave aparece con `sync: false` solo para que exista el *nombre* de la variable. **El valor no está en Git** (y no debe estarlo). Si no la rellenas en el dashboard, seguirás viendo *“Falta GOOGLE_CREDENTIALS_JSON”* — no es un fallo del deploy, es configuración pendiente.

### En Render (paso a paso)

1. [Dashboard Render](https://dashboard.render.com) → tu servicio web (p. ej. **khaya-disponibilidad**).
2. Menú lateral **Environment** (o **Environment Variables**).
3. **Add Environment Variable** (o **Add**).
4. **Key:** exactamente `GOOGLE_CREDENTIALS_JSON` (mayúsculas y guiones bajos como aquí).
5. **Value:** abre el archivo `.json` descargado de Google Cloud en un editor de texto, **selecciona todo** (Cmd+A) y pégalo en el campo. Debe empezar por `{` y terminar en `}`; puede ocupar varias líneas (Render lo permite).
6. **Save Changes**. Render suele **reiniciar** el servicio solo; si no, ve a **Manual Deploy** → **Deploy latest commit**.
7. Comprueba en el navegador o con curl (sustituye tu URL):
   - `https://TU-SERVICIO.onrender.com/api/sheets-enabled`
   - Debe salir `"write_enabled": true` y `"has_credentials": true` cuando el JSON es válido y `gspread` está instalado.

**Errores típicos**

- La hoja **no** está compartida con el `client_email` del JSON (debe ser **Editor**).
- Pegaste solo parte del JSON o añadiste comillas extra alrededor de todo el bloque (el valor debe ser JSON crudo).
- Variable mal escrita (`GOOGLE_CREDENTIALS_JSON` vs otro nombre).

### En local

En `backend/.env` (no lo subas a Git):

```bash
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...",...}'
```

O una línea por campo no: tiene que ser el JSON válido completo. En bash puedes usar comillas simples externas.

---

## D) Comprobar que `gspread` está instalado

El error *"no se pudo importar gspread"* significa que el **intérprete de Python que arranca uvicorn** no tiene el paquete. No es un bug del código: hay que instalar dependencias en **ese mismo** Python.

### Local (recomendado: venv en el repo)

```bash
cd /ruta/al/repo
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
python -c "import gspread; print('OK')"
```

Arranca el API siempre con ese entorno, por ejemplo:

```bash
cd backend && ../.venv/bin/uvicorn server:app --reload
```

Si usas el `python3` del sistema sin `pip install`, seguirás sin `gspread`.

### Render / producción

En los logs del build debe aparecer `pip install -r backend/requirements.txt` y terminación correcta. Si el build no instala dependencias, `gspread` no existirá en runtime.

---

## E) Probar

- `GET /api/sheets-enabled` debe devolver `"write_enabled": true` y `"gspread_available": true` cuando todo está bien.
- Cambia el estado de una unidad en la app; no debe salir error 503.

---

## F) Cómo ver qué falla en Render

No hace falta adivinar: el backend escribe en **stdout/stderr** y Render lo guarda.

1. [Dashboard Render](https://dashboard.render.com) → tu **Web Service** (p. ej. khaya-disponibilidad).
2. Menú **Logs** (o pestaña **Logs** arriba).
3. Filtra por texto: `Sheet write-back`, `failed`, `ERROR`, `Traceback`.
4. Reproduce el error (cambia un estado en la app) y **actualiza** los logs; debería aparecer una traza justo después.

**Qué mirar primero**

| Síntoma | Dónde mirar |
|--------|-------------|
| ¿Hay credenciales y gspread? | `GET https://TU-APP.onrender.com/api/sheets-enabled` |
| ¿Falló la API de Google al escribir? | Logs: `Sheet write-back failed` + traceback (403 = permisos; 404 = hoja/ID mal) |
| ¿Solo falla el build? | **Events** → último deploy → **Build logs** (no Runtime logs) |

**Build vs runtime**

- **Build logs:** `pip install`, `yarn build` — si el deploy no instala dependencias.
- **Runtime logs:** proceso `uvicorn` — errores al **cambiar estado**, sync, excepciones de `gspread`.

El mensaje **502** en la app resume el fallo; el **detalle exacto** (p. ej. `APIError 403` de Google) está en los **Logs** del servicio.

---

## Resumen rápido

| Qué | Dónde |
|-----|--------|
| Habilitar Sheets API | Google Cloud Console |
| JSON de cuenta de servicio | Cloud → Cuentas de servicio → Clave JSON |
| Compartir hoja | Sheets → Compartir → email `client_email` como Editor |
| Secreto en servidor | Variable `GOOGLE_CREDENTIALS_JSON` = contenido del JSON |

Si algo falla, mira primero los logs del servidor al arrancar y la respuesta de `/api/sheets-enabled` (`has_credentials`, `gspread_available`).

### Error: «This operation is not supported for this document» (400)

Suele aparecer si la hoja **no es una hoja de cálculo nativa de Google** (por ejemplo se subió un `.xlsx` y se abrió en Sheets). La API **no permite** aplicar formato de color en ese tipo de documento.

**Solución:** en Google Sheets → **Archivo** → **Guardar como hoja de cálculo de Google**, o **Hacer una copia** (genera una hoja nativa). Copia el **nuevo ID** del enlace (`/d/ID/`) en **`SPREADSHEET_ID`** en Render, vuelve a compartir la hoja con el `client_email` de la cuenta de servicio y redeploy.
