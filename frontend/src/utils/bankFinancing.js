/**
 * Financiamiento hipotecario USD a plazo fijo (referencia).
 * Ingreso requerido: regla 45% sobre la cuota bancaria (cuota / 0.45), alineada a cotizaciones comerciales Khaya.
 */

export const DEFAULT_TASA_ANUAL = 7.5;
export const DEFAULT_CUOTA_MANTENIMIENTO = 180;
export const PLAZO_ANOS_FINANCIAMIENTO = 30;

/** Ratio para estimar ingreso neto familiar mínimo a partir de la cuota bancaria. */
export const DTI_REFERENCIA_CUOTA = 0.45;

/**
 * Cuota mensual (amortización francesa).
 * @param {number} principalUsd
 * @param {number} annualRatePercent tasa nominal anual (%)
 * @param {number} years
 */
export function monthlyMortgagePayment(principalUsd, annualRatePercent, years = PLAZO_ANOS_FINANCIAMIENTO) {
  const n = Math.max(1, Math.floor(Number(years) * 12));
  const r = Number(annualRatePercent) / 100 / 12;
  const P = Math.max(0, Number(principalUsd) || 0);
  if (P <= 0) return 0;
  if (r <= 0) return P / n;
  return (P * (r * (1 + r) ** n)) / ((1 + r) ** n - 1);
}

export function computeBankFinancing(
  montoFinanciar,
  annualRatePercent,
  cuotaMantenimiento,
  years = PLAZO_ANOS_FINANCIAMIENTO
) {
  const cuotaBancaria = monthlyMortgagePayment(montoFinanciar, annualRatePercent, years);
  const mant = Math.max(0, Number(cuotaMantenimiento) || 0);
  const ingresoRequerido = cuotaBancaria / DTI_REFERENCIA_CUOTA;
  const totalGastosMensuales = cuotaBancaria + mant;
  return {
    cuotaBancaria: Math.round(cuotaBancaria * 100) / 100,
    ingresoRequerido: Math.round(ingresoRequerido * 100) / 100,
    totalGastosMensuales: Math.round(totalGastosMensuales * 100) / 100,
  };
}
