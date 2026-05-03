/**
 * Plan de pagos en calendario local: misma fecha civil (día del mes) en cada cuota,
 * cada cuota en un mes distinto — la primera cuota cae el mismo día del mes siguiente a la reserva.
 * Evita UTC (`new Date('YYYY-MM-DD')` es medianoche UTC y puede cambiar el día en zonas negativas).
 */

/** Mediodía local para que sumar meses no cambie de día por zona horaria al serializar. */
export function toLocalCalendarDate(input) {
  if (input == null) return noonTodayLocal();
  if (typeof input === 'string') {
    const localFromYmd = parseLocalYmdOnly(input);
    if (localFromYmd) return localFromYmd;
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date(NaN);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

/** Solo `YYYY-MM-DD` (sin hora) → fecha civil local. Cadenas ISO con `T` usan el `Date` de abajo. */
function parseLocalYmdOnly(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null;
  const d = new Date(y, mo, da, 12, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
  return d;
}

function noonTodayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0, 0);
}

/** Fecha corta Costa Rica: DD-MM-YYYY (calendario local). */
export function formatDateDdMmYyyy(value) {
  if (value == null || value === '') return '';
  const d = toLocalCalendarDate(value instanceof Date ? value : value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

export function addCalendarMonths(date, months) {
  const d = toLocalCalendarDate(date);
  d.setMonth(d.getMonth() + (Number(months) || 0));
  return d;
}

export function addCalendarDays(date, days) {
  const d = toLocalCalendarDate(date);
  d.setDate(d.getDate() + (Number(days) || 0));
  return d;
}
