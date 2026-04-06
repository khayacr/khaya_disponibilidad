export const PARKING_SMALL_M2 = 14.3;
export const PARKING_LARGE_M2 = 28.6;
/** Suplemento USD al pasar de parqueo estándar a doble (28,6 m²). */
export const PARKING_LARGE_PREMIUM_USD = 15000;

export function isSheetParkingLarge(parkingAreaM2) {
  const p = Number(parkingAreaM2);
  if (!Number.isFinite(p)) return false;
  return p >= (PARKING_SMALL_M2 + PARKING_LARGE_M2) / 2;
}

/**
 * El precio en hoja corresponde a la configuración de parqueo indicada en `parkingArea`.
 * Si el usuario elige otra opción, se ajusta ±US$15.000.
 */
export function parkingPremiumUsd(unit, parkingSize) {
  const sheetLarge = isSheetParkingLarge(unit?.parkingArea);
  const userLarge = parkingSize === 'large';
  if (userLarge && !sheetLarge) return PARKING_LARGE_PREMIUM_USD;
  if (!userLarge && sheetLarge) return -PARKING_LARGE_PREMIUM_USD;
  return 0;
}

export function parkingM2ForSize(parkingSize) {
  return parkingSize === 'large' ? PARKING_LARGE_M2 : PARKING_SMALL_M2;
}

export function totalAreaM2(unitArea, parkingSize) {
  const apt = Number(unitArea) || 0;
  return apt + parkingM2ForSize(parkingSize);
}
