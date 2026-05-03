## Learned User Preferences
- When asked to match a reference PDF/design, prioritize 1:1 visual fidelity and reuse the provided assets; if exact fonts aren’t available, pick the closest equivalents.

## Learned Workspace Facts
- Frontend production builds that run `yarn install` / `craco build` only inside `frontend/` (e.g. Render) only install dependencies listed in `frontend/package.json`; npm packages imported from `frontend/src` (such as `svg2pdf.js`) must be declared there, not only in a repo-root `package.json`.
- The web app is installable as a PWA: `frontend/public/manifest.json`, `frontend/public/sw.js`, icons under `frontend/public/icons/`; the service worker registers in production only (`frontend/src/index.js`).
- Cotización/reservation PDFs use Illustrator SVG templates in `frontend/public/pdf-templates/`, runtime injection in `frontend/src/utils/svgCotizacionInject.js`, and `svg2pdf` in `generateReservationPDF.js`; floor plan PNGs resolve from `frontend/public/plantas-detalle/` via `floorPlanLayout.js` (`getDetailPlanImageCandidates`).
- Payment dates for reservas/cuotas use `frontend/src/utils/paymentCalendar.js` (local-date normalization, typically noon) so `UnitModal.jsx` and `generateReservationPDF.js` agree and avoid UTC day-shift from `<input type="date">`.
- svg2pdf in this flow is sensitive to SVG stacking and defs: keep the detail-plan raster earlier in the DOM than `#pdf-entrega`, and place `#pdf-amenities-row` after the raster so tiles and text are not covered; small icons are more reliable as inline paths than `<use href="#…">`; for “Entrega en …” + date, use the same `font-size` on both tspans and add horizontal separation (e.g. `dx`) so the prefix and date do not collide.
- Repo is split into `frontend/` (React + CRA + Craco) and `backend/` (FastAPI in `backend/server.py`).
- Backend reads Google Sheets data via public XLSX export (`httpx` + `openpyxl`); optional `gspread` service-account setup is used for write-back.
- Generated units use **2 bathrooms** everywhere the app builds unit rows: `backend/server.py` (API from Sheets) and `frontend/src/data/units.js` (local generator); UI and PDF use `unit.bathrooms`.
- Local backend setup may require Python 3.12 (system Python 3.14 can fail to build/install `pydantic-core` pinned in `requirements.txt`).
