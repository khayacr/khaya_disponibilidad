import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import {
  computeBankFinancing,
  DEFAULT_CUOTA_MANTENIMIENTO,
  DEFAULT_TASA_ANUAL,
  PLAZO_ANOS_FINANCIAMIENTO,
} from './bankFinancing';
import { getDetailPlanImageCandidates } from './floorPlanLayout';
import {
  consolidateSvgTextForPdf,
  injectCotizacionPage1,
  injectCotizacionPage2,
} from './svgCotizacionInject';
import { applyKhayaSvgFontFamilies, embedKhayaPdfFonts } from './pdfFonts';
import {
  addCalendarDays,
  addCalendarMonths,
  formatDateDdMmYyyy,
  toLocalCalendarDate,
} from './paymentCalendar';

/**
 * Cotización: plantillas SVG con textos editables; los datos se inyectan en los nodos <text>
 * antes de svg2pdf (sin doc.text superpuesto).
 */

function assetUrl(filename) {
  const base =
    typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL.replace(/\/$/, '')
      : '';
  if (base) return `${base}/${filename}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/${filename}`;
  }
  return `/${filename}`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function mimeTypeFromPath(filePath) {
  const p = String(filePath).toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

/** URL absoluta para fetch (respeta PUBLIC_URL y el origen del sitio). */
function absoluteFetchUrlForPath(publicPath) {
  const clean = String(publicPath).replace(/^\//, '');
  const rel = assetUrl(clean);
  if (/^https?:\/\//i.test(rel)) return rel;
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(rel, window.location.origin).href;
    } catch {
      return rel;
    }
  }
  return rel;
}

async function fetchFirstDetailPlanDataUrl(unit) {
  const candidates = getDetailPlanImageCandidates(unit);
  for (const relPath of candidates) {
    const url = absoluteFetchUrlForPath(relPath);
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const extOk = /\.(png|jpe?g|webp|gif)$/i.test(relPath);
      if (!ct.startsWith('image/') && !extOk) continue;
      const buf = await res.arrayBuffer();
      const mime = mimeTypeFromPath(relPath);
      return `data:${mime};base64,${arrayBufferToBase64(buf)}`;
    } catch {
      /* siguiente candidato */
    }
  }
  return null;
}

/** Convierte <image href="archivo.png"> en data URL para que svg2pdf renderice el raster (fetch desde public/). */
async function inlineExternalRasterImages(svgEl, templatePath) {
  const baseDir = templatePath.replace(/\/[^/]+$/, '/');
  const nodes = Array.from(svgEl.querySelectorAll('image'));
  for (const img of nodes) {
    const hrefRaw =
      img.getAttribute('href') ||
      img.getAttribute('xlink:href') ||
      img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
      '';
    if (!hrefRaw || hrefRaw.startsWith('data:') || /^https?:\/\//i.test(hrefRaw)) continue;
    const rel = hrefRaw.replace(/^\.\//, '');
    const path = rel.startsWith('/') ? rel.slice(1) : `${baseDir}${rel}`;
    const url = absoluteFetchUrlForPath(path);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const buf = await res.arrayBuffer();
      const mime = mimeTypeFromPath(path);
      const dataUrl = `data:${mime};base64,${arrayBufferToBase64(buf)}`;
      img.setAttribute('href', dataUrl);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
    } catch {
      /* sin imagen el PDF sigue; evita romper descarga */
    }
  }
}

async function drawSvgTemplatePage(doc, templatePath, pageW, pageH, injectFn) {
  const res = await fetch(absoluteFetchUrlForPath(templatePath));
  if (!res.ok) throw new Error(`Plantilla no encontrada: ${templatePath}`);
  const svgText = await res.text();
  const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svgEl = parsed.querySelector('svg');
  if (!svgEl) throw new Error('SVG inválido');

  if (typeof injectFn === 'function') injectFn(svgEl);

  applyKhayaSvgFontFamilies(svgEl);

  consolidateSvgTextForPdf(svgEl);

  await inlineExternalRasterImages(svgEl, templatePath);

  await svg2pdf(svgEl, doc, { xOffset: 0, yOffset: 0, scale: 1, width: pageW, height: pageH });
}

/** Enlaces del pie (mismo layout en cotizacion-01 y cotizacion-02, viewBox 612×792). */
const COTIZACION_FOOTER_LINKS = [
  { x: 158, y: 760, w: 65, h: 16, url: 'tel:+50640014670' },
  { x: 223, y: 760, w: 55, h: 16, url: 'https://www.instagram.com/khaya.cr/' },
  { x: 278, y: 760, w: 64, h: 16, url: 'https://www.facebook.com/khayalatam/' },
  { x: 342, y: 760, w: 53, h: 16, url: 'https://www.tiktok.com/@khaya.cr' },
  { x: 395, y: 760, w: 60, h: 16, url: 'https://khaya.cr/' },
];

function addCotizacionFooterLinks(doc, pageW, pageH) {
  const vbW = 612;
  const vbH = 792;
  const sx = pageW / vbW;
  const sy = pageH / vbH;
  COTIZACION_FOOTER_LINKS.forEach(({ x, y, w, h, url }) => {
    doc.link(x * sx, y * sy, w * sx, h * sy, { url });
  });
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateLong() {
  return new Date().toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatM2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

export async function generateReservationPDF(unit, salesPlan) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  await embedKhayaPdfFonts(doc, absoluteFetchUrlForPath);

  const primaPctLabel =
    salesPlan.primaEquivPct != null
      ? `${salesPlan.primaEquivPct}%`
      : salesPlan.primaPct != null
        ? `${Number(salesPlan.primaPct).toFixed(1)}%`
        : '10.0%';

  const detailPlanDataUrl = await fetchFirstDetailPlanDataUrl(unit);

  const injectHelpers = {
    formatPrice,
    formatDateLong,
    formatM2,
    formatPaymentDateSlash: formatDateDdMmYyyy,
    primaPctLabel,
    detailPlanDataUrl,
  };

  const baseDate = toLocalCalendarDate(
    salesPlan.reservaDate ? new Date(salesPlan.reservaDate) : new Date(),
  );
  const cuotas = Math.max(1, Math.floor(Number(salesPlan.mesesPrima || 1)));
  const primaTotal = Number(salesPlan.primaTotal || 0);
  const reserva = Number(salesPlan.reserva || 0);
  const opc = Number(salesPlan.opcionCompra || 0);
  const remaining = Math.max(0, primaTotal - reserva - opc);
  const cuotaBase =
    Number(salesPlan.cuotaMensual || 0) > 0
      ? Number(salesPlan.cuotaMensual || 0)
      : Math.round(((remaining / cuotas) || 0) * 100) / 100;
  const lastCuota = Math.round((remaining - cuotaBase * (cuotas - 1)) * 100) / 100;
  const opcDate = addCalendarDays(baseDate, 15);
  const cuotaStartDate = addCalendarMonths(baseDate, 1);

  const payMeta = [];
  payMeta.push({ label: 'RESERVA', amount: reserva, date: baseDate, accent: false });
  payMeta.push({ label: 'OPCIÓN DE COMPRA', amount: opc, date: opcDate, accent: false });
  for (let i = 1; i <= cuotas; i += 1) {
    const amount = i === cuotas ? Math.max(0, lastCuota) : cuotaBase;
    const date = addCalendarMonths(cuotaStartDate, i - 1);
    payMeta.push({
      label: `CUOTA ${String(i).padStart(2, '0')}/${String(cuotas).padStart(2, '0')}`,
      amount,
      date,
      accent: true,
    });
  }

  const tasaPdf = Number.isFinite(Number(salesPlan.tasaAnualPct))
    ? Number(salesPlan.tasaAnualPct)
    : DEFAULT_TASA_ANUAL;
  const mantPdf = Number.isFinite(Number(salesPlan.cuotaMantenimiento))
    ? Number(salesPlan.cuotaMantenimiento)
    : DEFAULT_CUOTA_MANTENIMIENTO;
  const plazoPdf = Number(salesPlan.plazoAnosFinanciamiento) || PLAZO_ANOS_FINANCIAMIENTO;
  const bankFin =
    salesPlan.bankFinancing && typeof salesPlan.bankFinancing === 'object'
      ? salesPlan.bankFinancing
      : computeBankFinancing(salesPlan.montoFinanciar, tasaPdf, mantPdf, plazoPdf);

  const finVals = [
    `${tasaPdf.toFixed(2).replace(/\.?0+$/, '')}%`,
    formatPrice(bankFin.ingresoRequerido),
    formatPrice(bankFin.cuotaBancaria),
    formatPrice(mantPdf),
    formatPrice(bankFin.totalGastosMensuales),
  ];

  await drawSvgTemplatePage(doc, 'pdf-templates/cotizacion-01.svg', pageW, pageH, (svgEl) => {
    injectCotizacionPage1(svgEl, unit, salesPlan, injectHelpers);
  });
  addCotizacionFooterLinks(doc, pageW, pageH);

  doc.addPage();

  await drawSvgTemplatePage(doc, 'pdf-templates/cotizacion-02.svg', pageW, pageH, (svgEl) => {
    injectCotizacionPage2(svgEl, payMeta, finVals, injectHelpers);
  });
  addCotizacionFooterLinks(doc, pageW, pageH);

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Cotizacion_${unit.code}_${dateStr}.pdf`);
}
