/**
 * Misma lógica para Planta, Mapa y cualquier listado filtrado.
 * minPrice/maxPrice: null = sin filtrar; 0 es un valor válido.
 */
export function matchesUnitFilters(unit, filters) {
  if (!filters) return true;
  if (filters.view && unit.view !== filters.view) return false;
  if (filters.status && unit.status !== filters.status) return false;
  if (filters.minPrice != null && unit.price < filters.minPrice) return false;
  if (filters.maxPrice != null && unit.price > filters.maxPrice) return false;
  return true;
}

/** Orden fijo para el desplegable (alineado con backend). */
export const CANONICAL_VIEWS = [
  'Vista Este',
  'Vista Este Esquina',
  'Vista Oeste',
  'Vista Oeste Esquina',
];

