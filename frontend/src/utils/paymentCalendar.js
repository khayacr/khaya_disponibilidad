/**
 * Fechas del plan de pagos en calendario local (mismo día del mes en reserva y cuotas).
 * Evita desfasajes por UTC u horas tipo 00:00 que mueven el día al formatear.
 */

/** Mediodía local para que sumar meses no cambie de día por zona horaria al serializar. */
export function toLocalCalendarDate(input) {
  if (input == null) return noonTodayLocal();
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date(NaN);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function noonTodayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0, 0);
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
