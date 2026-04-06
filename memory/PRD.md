# KHAYA Real Estate Premium Website - PRD

## Original Problem Statement
Web interactiva de disponibilidades inmobiliarias premium inspirada en https://proyecto.venturaskyresidences.uy/. Proyecto de 14 pisos con 10 apartamentos por piso (140 unidades por torre). Diseño elegante, minimalista, estilo showroom inmobiliario de lujo. Datos sincronizados desde Google Sheets público.

## User Personas
1. **Compradores potenciales**: Buscan información detallada de unidades disponibles
2. **Inversores**: Analizan rentabilidad y precios por piso/tipo
3. **Agentes inmobiliarios**: Usan la herramienta para mostrar disponibilidad a clientes
4. **Administrador del proyecto**: Actualiza disponibilidad desde Google Sheets y web

## Core Requirements
- Hero section con fachada del edificio
- Explorador interactivo por pisos (1-14)
- Plano interactivo con apartamentos clickeables
- Modal de detalle con Plan de Venta personalizado editable
- Estados: Disponible (verde), Reservado (amarillo), Vendido (naranja), Bloqueado (gris)
- Filtros: vista (Este/Oeste), tipo (Central/Esquinero), estado, rango de precio
- Selector de Torres (E, F, G) con datos dinámicos
- Sincronización con Google Sheets público (XLSX export)
- Responsive design

## Architecture
- **Frontend**: React (Vite), Tailwind CSS, Shadcn UI, Lucide Icons
- **Backend**: FastAPI, Motor (MongoDB async driver), httpx, openpyxl
- **Database**: MongoDB (collections: units, towers, manual_status_overrides, contact_requests)
- **Data Source**: Google Sheets XLSX (public, 3 tabs = 3 torres)

## Key API Endpoints
- `GET /api/towers` - Lista de torres
- `GET /api/units` - Unidades con filtros (tower, floor, view, status, type, price)
- `GET /api/units/{id}` - Detalle de unidad
- `PUT /api/units/{id}` - Actualizar unidad (persiste overrides manuales)
- `POST /api/sync` - Re-sincronizar desde Google Sheets
- `GET /api/stats` - Estadísticas de disponibilidad
- `GET /api/filters` - Opciones de filtro

## Data Model
- **units**: {id, code, tower, floor, apartment, price, view, viewDirection, type, status, area, parkingArea, totalArea, bedrooms, bathrooms, delivery, rentability}
- **towers**: {name, floors, apartments, delivery}
- **manual_status_overrides**: {unit_id, status} - preserva cambios manuales durante re-sync

## What's Been Implemented (Feb 2026)

### Frontend
- [x] Hero section con imagen de fachada real
- [x] Navegación glassmorphism con botón de contacto
- [x] Selector de torres (E, F, G)
- [x] Selector de pisos 1-14 con indicador de disponibles
- [x] Plano interactivo con overlays de color por estado
- [x] Modal de Plan de Venta con cálculos dinámicos editables
- [x] Filtros funcionales (vista, estado, tipo, rango de precio)
- [x] Leyenda con estadísticas por torre
- [x] Formulario de contacto slide-over
- [x] Diseño premium tema oscuro (Jewel & Luxury)
- [x] Cambio de estado desde modal (dropdown)
- [x] Vendido no clickeable (cursor not-allowed + X overlay)
- [x] Badge "Made with Emergent" removido
- [x] Indicador de sincronización con hora y estado (punto verde pulsante)

### Backend
- [x] Sincronización con Google Sheets (descarga XLSX, parseo colores)
- [x] 3 Torres dinámicas desde pestañas del Sheet
- [x] Detección de estados desde colores de celdas Excel (Rojo→Vendido, Gris→Bloqueado, Azul→Disponible)
- [x] Persistencia de overrides manuales de estado
- [x] CRUD completo de unidades
- [x] Endpoint de re-sync manual
- [x] Auto-sync periódico cada 60 segundos (background task con asyncio)
- [x] Endpoint GET /api/sync-status para consultar última sincronización
- [x] 417 unidades cargadas (3 torres × ~139 unidades)

### Google Sheets Integration
- Descarga XLSX público vía `export?format=xlsx`
- Doble carga: data_only=False para colores, data_only=True para valores
- Colores: FFFF0000 (Rojo→Vendido), FFA5A5A5 (Gris→Bloqueado), FF83CAEB (Azul→Reservado), FFB8D4EF (Azul claro→Disponible)
- Nota: El export de Google Sheets puede perder colores en re-descargas; overrides manuales preservan estados

## Prioritized Backlog

### P0 - Completed
- [x] MVP completo funcional
- [x] Sincronización Google Sheets multi-torre
- [x] Badge removido para deploy en Render

### P1 - Next Phase
- [ ] Verificar preparación para deploy en Render (scripts de inicio, requirements)
- [ ] Panel de administración para gestión masiva de disponibilidad
- [ ] WhatsApp integration para contacto directo
- [ ] Galería de imágenes por tipología

### P2 - Future Enhancements
- [ ] Comparador de unidades
- [ ] Simulador de financiamiento avanzado
- [ ] Tour virtual 360°
- [ ] Multi-idioma (ES/EN)
