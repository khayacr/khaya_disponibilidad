/**
 * Planta interactiva y PDF: misma imagen y posiciones (calibrado a planta-tipo 1024×631).
 */

export const FLOOR_PLAN_ASPECT_RATIO = 1024 / 631;

/** Posiciones por nº de apartamento (porcentajes del ancho/alto de la imagen). */
export const UNIT_POSITIONS = {
  8: { top: '18.88%', left: '13.28%', width: '13.67%', height: '21.23%' },
  9: { top: '28.38%', left: '27.83%', width: '13.48%', height: '21.87%' },
  10: { top: '18.72%', left: '42.29%', width: '13.67%', height: '21.56%' },
  1: { top: '28.55%', left: '57.03%', width: '13.48%', height: '21.71%' },
  2: { top: '18.88%', left: '71.39%', width: '13.67%', height: '21.23%' },
  7: { top: '58.30%', left: '13.28%', width: '13.67%', height: '21.56%' },
  6: { top: '52.28%', left: '27.83%', width: '13.48%', height: '21.87%' },
  5: { top: '58.30%', left: '42.29%', width: '13.67%', height: '21.56%' },
  4: { top: '52.43%', left: '57.03%', width: '13.48%', height: '21.71%' },
  3: { top: '58.30%', left: '71.39%', width: '13.67%', height: '21.56%' },
};

/** Piso 1 = planta baja; resto = planta tipo (misma disposición de aptos en el PNG). */
export function getFloorPlanImageFilename(floor) {
  return Number(floor) === 1 ? 'planta-baja.png' : 'planta-tipo.png';
}

export function getFloorPlanImageUrl(floor) {
  const base =
    typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL.replace(/\/$/, '')
      : '';
  const name = getFloorPlanImageFilename(floor);
  if (base) return `${base}/${name}`;
  return `/${name}`;
}

/** Convierte '18.88%' → 0.1888 */
export function parseFloorPlanPercent(value) {
  const n = parseFloat(String(value).replace('%', '').trim());
  return Number.isFinite(n) ? n / 100 : 0;
}

/**
 * Letra de torre desde `unit.tower` (ej. "Torre E" → "E").
 */
export function towerLetterFromUnit(unit) {
  const t = (unit?.tower || '').replace(/^Torre\s*/i, '').trim();
  return (t.charAt(0) || 'E').toUpperCase();
}

const DETALLE_EXT = ['png', 'jpg', 'jpeg'];

/**
 * Piso 1: grupos que comparten `planta_baja_{nums}.png` (mismos números ordenados).
 * Si un apto entra en varios grupos, se prueba primero el grupo más largo (ej. 7 → 3-5-7 antes que 4-7).
 */
export const PLANTA_BAJA_SHARED_LAYOUTS = [
  [1, 8],
  [2, 9],
  [3, 5, 7],
  [4, 7],
];

/**
 * Pisos 2–14: grupos que comparten `planta_tipo_{nums}.png`.
 * Misma regla de prioridad por longitud de grupo (ej. 8 → 4-7-8 antes que 1-8).
 */
export const PLANTA_TIPO_SHARED_LAYOUTS = [
  [2, 9, 10],
  [1, 8],
  [3, 5, 6],
  [4, 7, 8],
];

function groupFilenameKey(group) {
  return [...group].sort((a, b) => a - b).join('-');
}

function pushGroupFilenames(list, prefix, groups, apt) {
  const matching = groups.filter((g) => g.includes(apt));
  matching.sort((a, b) => b.length - a.length);
  for (const group of matching) {
    const key = groupFilenameKey(group);
    for (const ext of DETALLE_EXT) {
      list.push(`plantas-detalle/${prefix}_${key}.${ext}`);
    }
  }
}

/**
 * Convención Khaya en `public/plantas-detalle/`:
 * - Planta baja: `planta_baja_{a}-{b}-…` según PLANTA_BAJA_SHARED_LAYOUTS; fallback `planta_baja_1-{apto}` / `planta_baja_apto_{apto}`
 * - Planta tipo: `planta_tipo_{a}-{b}-…` según PLANTA_TIPO_SHARED_LAYOUTS; fallback `planta_tipo_apto_{apto}`
 */
function pushKhayaPlantaDetalleFilenames(list, unit) {
  const floor = Number(unit.floor);
  const apt = Number(unit.apartment);
  if (!Number.isFinite(floor) || !Number.isFinite(apt)) return;

  if (floor === 1) {
    pushGroupFilenames(list, 'planta_baja', PLANTA_BAJA_SHARED_LAYOUTS, apt);
    for (const ext of DETALLE_EXT) {
      list.push(`plantas-detalle/planta_baja_${floor}-${apt}.${ext}`);
      list.push(`plantas-detalle/planta_baja_apto_${apt}.${ext}`);
    }
    return;
  }

  pushGroupFilenames(list, 'planta_tipo', PLANTA_TIPO_SHARED_LAYOUTS, apt);
  for (const ext of DETALLE_EXT) {
    list.push(`plantas-detalle/planta_tipo_apto_${apt}.${ext}`);
  }
}

/**
 * Rutas a probar en `public/plantas-detalle/` para PDF (planta detallada por unidad).
 * Orden: convención Khaya (planta_baja_ / planta_tipo_) primero; luego nombres genéricos.
 */
export function getDetailPlanImageCandidates(unit) {
  const tower = towerLetterFromUnit(unit);
  const floor = Number(unit.floor);
  const apt = Number(unit.apartment);
  const floor2 = Number.isFinite(floor) ? String(floor).padStart(2, '0') : '';
  const apt2 = Number.isFinite(apt) ? String(apt).padStart(2, '0') : '';
  const code = (unit?.code || '').trim();

  const list = [];

  pushKhayaPlantaDetalleFilenames(list, unit);

  if (code && /^[A-Za-z0-9-]+$/.test(code)) {
    list.push(`plantas-detalle/${code}.png`, `plantas-detalle/${code}.jpg`);
  }
  if (floor2 && apt2) {
    list.push(
      `plantas-detalle/${tower}-${floor2}-${apt2}.png`,
      `plantas-detalle/${tower}-${floor2}-${apt2}.jpg`,
      `plantas-detalle/${tower}-${floor}-${apt}.png`,
      `plantas-detalle/${tower}-${floor}-${apt}.jpg`
    );
  }
  if (Number.isFinite(apt)) {
    list.push(
      `plantas-detalle/${tower}-${apt}.png`,
      `plantas-detalle/${tower}-${apt}.jpg`,
      `plantas-detalle/${tower}-${apt2}.png`,
      `plantas-detalle/${tower}-${apt2}.jpg`,
      `plantas-detalle/apto-${apt2}.png`,
      `plantas-detalle/apto-${apt2}.jpg`,
      `plantas-detalle/apto-${apt}.png`,
      `plantas-detalle/apto-${apt}.jpg`
    );
  }

  return [...new Set(list)];
}
