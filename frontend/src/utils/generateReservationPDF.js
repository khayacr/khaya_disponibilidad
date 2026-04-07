import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  computeBankFinancing,
  DEFAULT_CUOTA_MANTENIMIENTO,
  DEFAULT_TASA_ANUAL,
  PLAZO_ANOS_FINANCIAMIENTO,
} from './bankFinancing';
import { PDF, PDF_COPY, PDF_LINE } from './khayaPdfTheme';
import {
  FLOOR_PLAN_ASPECT_RATIO,
  UNIT_POSITIONS,
  getDetailPlanImageCandidates,
  getFloorPlanImageFilename,
  parseFloorPlanPercent,
} from './floorPlanLayout';

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

function formatPaymentDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(d);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

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

/** Espacio reservado al pie de página para el pie de marca (mm). */
const TABLE_MARGIN_BOTTOM = 24;

const tableBase = {
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 8,
    textColor: PDF.ink,
    cellPadding: { top: 2, right: 2.8, bottom: 2, left: 2.8 },
    lineColor: PDF.line,
    lineWidth: PDF_LINE,
  },
  headStyles: {
    fillColor: PDF.cream,
    textColor: PDF.ink,
    fontStyle: 'bold',
    fontSize: 8,
    cellPadding: { top: 2, right: 2.8, bottom: 2, left: 2.8 },
    lineColor: PDF.line,
    lineWidth: PDF_LINE,
  },
  alternateRowStyles: {
    fillColor: PDF.white,
  },
  bodyStyles: {
    fillColor: PDF.cream,
    lineColor: PDF.line,
    lineWidth: PDF_LINE,
  },
};

function drawFooterOnPage(doc, pageW, pageH, margin) {
  const footerTop = pageH - 26;
  doc.setDrawColor(...PDF.line);
  doc.setLineWidth(PDF_LINE);
  doc.line(margin, footerTop - 4, pageW - margin, footerTop - 4);

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...PDF.ink);
  doc.text(PDF_COPY.footerSerif, pageW / 2, footerTop, { align: 'center', maxWidth: pageW - margin * 2 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF.muted);
  doc.text(PDF_COPY.footerContact, pageW / 2, footerTop + 6, { align: 'center' });
}

function applyFooters(doc, pageW, pageH, margin) {
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i);
    drawFooterOnPage(doc, pageW, pageH, margin);
  }
}

export async function generateReservationPDF(unit, salesPlan) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;

  doc.setFillColor(...PDF.paper);
  doc.rect(0, 0, pageW, pageH, 'F');

  let y = 14;

  // ── Logotipo ────────────────────────────────────────────────────
  try {
    const logoCandidates = ['khaya_logo.png', 'logo-khaya.png'];
    let logoData = null;
    for (const name of logoCandidates) {
      try {
        logoData = await fetchImageAsBase64(assetUrl(name));
        break;
      } catch {
        /* next */
      }
    }
    if (!logoData) throw new Error('no logo');
    const logoMaxW = 48;
    const logoMaxH = 24;
    const logoPrepared = await preparePdfImageData(doc, logoData);
    const imgProps = logoPrepared.props;
    const ratio = Math.min(logoMaxW / imgProps.width, logoMaxH / imgProps.height);
    const logoW = imgProps.width * ratio;
    const logoH = imgProps.height * ratio;
    doc.addImage(logoPrepared.dataUrl, logoPrepared.format, (pageW - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PDF.ink);
    doc.text('KHAYA', pageW / 2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text('Residencias de lujo', pageW / 2, y + 12, { align: 'center' });
    y += 18;
  }

  doc.setDrawColor(...PDF.line);
  doc.setLineWidth(PDF_LINE);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ── Título documento ────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PDF.ink);
  doc.text(`Cotización ${unit.code}`, pageW / 2, y, { align: 'center' });
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF.ink);
  doc.text(`Fecha ${formatDateLong()}`, pageW / 2, y, { align: 'center' });
  y += 8.5;

  const aptM2 = salesPlan.aptArea != null ? salesPlan.aptArea : unit.area;
  const parkM2 = salesPlan.parkingM2 != null ? salesPlan.parkingM2 : unit.parkingArea;
  const totalM2 =
    salesPlan.totalAreaM2 != null ? salesPlan.totalAreaM2 : Number(aptM2) + Number(parkM2);

  // ── Resumen (bloque crema) ──────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text('Resumen', margin, y);
  y += 4.5;

  const resumenH = 21;
  doc.setFillColor(...PDF.cream);
  doc.setDrawColor(...PDF.line);
  doc.setLineWidth(PDF_LINE);
  doc.roundedRect(margin, y, pageW - margin * 2, resumenH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF.ink);
  const resumenLines = [
    `${unit.tower}  ·  Apartamento ${unit.code}`,
    `${aptM2} m² área habitable  ·  ${parkM2} m² parqueo  ·  ${Number(totalM2).toFixed(1)} m² total construido`,
    `${unit.bedrooms} hab.  ·  ${unit.bathrooms} baño${Number(unit.bathrooms) !== 1 ? 's' : ''}  ·  ${unit.view}  ·  Piso ${unit.floor}`,
    `Entrega estimada: ${unit.delivery}  ·  Tipo: ${unit.type}`,
  ];
  let ry = y + 5;
  resumenLines.forEach((line) => {
    doc.text(line, margin + 3.5, ry);
    ry += 3.9;
  });
  y += resumenH + 6.5;

  // ── Planta: prioridad a `public/plantas-detalle/` (plano detallado); si no, planta piso + recuadro ──
  const contentW = pageW - margin * 2;
  const maxPlanHDetail = 76;
  const maxPlanHFallback = 60;

  const detailCandidates = getDetailPlanImageCandidates(unit);
  const detailLoaded = await fetchFirstImageFromCandidates(detailCandidates);

  let detailPrepared = null;
  if (detailLoaded) {
    try {
      detailPrepared = await preparePdfImageData(doc, detailLoaded.data);
    } catch {
      detailPrepared = null;
    }
  }

  let planImgW;
  let planImgH;
  if (detailPrepared) {
    const ip = detailPrepared.props;
    const fitted = fitImageToMaxBox(ip.width, ip.height, contentW, maxPlanHDetail);
    planImgW = fitted.imgW;
    planImgH = fitted.imgH;
  } else {
    planImgW = contentW;
    planImgH = planImgW / FLOOR_PLAN_ASPECT_RATIO;
    if (planImgH > maxPlanHFallback) {
      planImgH = maxPlanHFallback;
      planImgW = planImgH * FLOOR_PLAN_ASPECT_RATIO;
    }
  }

  const planSectionH = 4 + planImgH + 12;
  if (y + planSectionH > pageH - TABLE_MARGIN_BOTTOM) {
    doc.addPage();
    doc.setFillColor(...PDF.paper);
    doc.rect(0, 0, pageW, pageH, 'F');
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text(
    detailPrepared ? 'Planta del apartamento' : 'Planta referencial',
    margin,
    y
  );
  y += 5;

  if (detailPrepared) {
    const imgX = margin + (contentW - planImgW) / 2;
    doc.addImage(detailPrepared.dataUrl, detailPrepared.format, imgX, y, planImgW, planImgH);
    y += planImgH + 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF.muted);
    doc.text(
      `Planta detallada · ${unit.tower} · ${unit.code} · Piso ${unit.floor}`,
      pageW / 2,
      y,
      { align: 'center', maxWidth: contentW }
    );
    y += 6.5;
  } else {
    const planImgName = getFloorPlanImageFilename(unit.floor);
    try {
      const planData = await fetchImageAsBase64(assetUrl(planImgName));
      const planPrepared = await preparePdfImageData(doc, planData);
      const imgX = margin + (contentW - planImgW) / 2;
      doc.addImage(planPrepared.dataUrl, planPrepared.format, imgX, y, planImgW, planImgH);

      const ap = Number(unit.apartment);
      const pos = UNIT_POSITIONS[ap];
      if (pos) {
        const pl = parseFloorPlanPercent(pos.left);
        const pt = parseFloorPlanPercent(pos.top);
        const pw = parseFloorPlanPercent(pos.width);
        const ph = parseFloorPlanPercent(pos.height);
        doc.setDrawColor(...PDF.accent);
        doc.setLineWidth(0.55);
        doc.rect(imgX + pl * planImgW, y + pt * planImgH, pw * planImgW, ph * planImgH, 'S');
      }

      y += planImgH + 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF.muted);
      doc.text(
        `Piso ${unit.floor} · Apartamento ${unit.apartment} · Planta del piso (referencia). Coloca PNG/JPG en public/plantas-detalle/ para usar tu planta detallada.`,
        pageW / 2,
        y,
        { align: 'center', maxWidth: contentW }
      );
      y += 6.5;
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF.muted);
      doc.text(
        `No hay planta detallada en public/plantas-detalle/ ni planta de piso (${planImgName} en public/).`,
        margin,
        y,
        { align: 'left', maxWidth: contentW }
      );
      y += 6.5;
    }
  }

  // ── Plan de inversión ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text('Plan de inversión', margin, y);
  y += 3.5;

  const prem = Number(salesPlan.parkingPremium);
  const hasPrem = Number.isFinite(prem) && Math.abs(prem) > 0.005;
  const baseForRows = salesPlan.basePrice != null ? salesPlan.basePrice : salesPlan.price - (hasPrem ? prem : 0);

  const primaPctLabel =
    salesPlan.primaMode === 'amount' && salesPlan.primaEquivPct
      ? `${salesPlan.primaEquivPct}%`
      : `${salesPlan.primaPct}%`;

  const planRows = [];
  if (hasPrem) {
    planRows.push(['Precio base (listado)', formatPrice(baseForRows), false]);
    planRows.push(['Ajuste por parqueo seleccionado', formatPrice(prem), false]);
  }
  planRows.push(['Precio total', formatPrice(salesPlan.price), true]);
  planRows.push([`Prima (${primaPctLabel})`, formatPrice(salesPlan.primaTotal), true]);
  planRows.push(['Monto a financiar / pago de contado', formatPrice(salesPlan.montoFinanciar), true]);

  autoTable(doc, {
    ...tableBase,
    startY: y,
    margin: { left: margin, right: margin, bottom: TABLE_MARGIN_BOTTOM },
    head: [['Concepto', 'Valor']],
    body: planRows.map(([a, b]) => [a, b]),
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'normal' },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      const flag = planRows[data.row.index]?.[2];
      if (flag) {
        data.cell.styles.textColor = PDF.accent;
      } else {
        data.cell.styles.textColor = PDF.ink;
      }
      data.cell.styles.fillColor = data.row.index % 2 === 0 ? PDF.cream : PDF.white;
      if (data.column.index === 0) {
        data.cell.styles.fontStyle = 'normal';
      }
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // ── Detalle adicional (sin naranja en montos secundarios) ────────
  const extraRows = [
    ['Reserva', formatPrice(salesPlan.reserva)],
    ['Opción de compra (15 días)', formatPrice(salesPlan.opcionCompra)],
    [
      `Prima fraccionada (${salesPlan.mesesPrima} pagos)`,
      `${formatPrice(salesPlan.primaFraccionada)} / mes`,
    ],
    [`Gastos de cierre aprox. (${salesPlan.gastosCierrePct}%)`, formatPrice(salesPlan.gastosCierre)],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text('Condiciones complementarias', margin, y);
  y += 3.5;

  autoTable(doc, {
    ...tableBase,
    startY: y,
    margin: { left: margin, right: margin, bottom: TABLE_MARGIN_BOTTOM },
    head: [['Concepto', 'Valor']],
    body: extraRows,
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'normal' },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold', textColor: PDF.ink },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        data.cell.styles.fillColor = data.row.index % 2 === 0 ? PDF.cream : PDF.white;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // ── Calendario de pagos (cuotas en naranja) ─────────────────────
  const baseDate = salesPlan.reservaDate ? new Date(salesPlan.reservaDate) : new Date();
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

  const opcDate = addDays(baseDate, 15);
  const cuotaStartDate = addMonths(baseDate, 1);

  const payMeta = [];
  payMeta.push({ label: 'Reserva', amount: reserva, date: baseDate, accent: false });
  payMeta.push({ label: 'Opción de compra', amount: opc, date: opcDate, accent: false });
  for (let i = 1; i <= cuotas; i += 1) {
    const amount = i === cuotas ? Math.max(0, lastCuota) : cuotaBase;
    const date = addMonths(cuotaStartDate, i - 1);
    payMeta.push({
      label: `Cuota ${String(i).padStart(2, '0')} / ${cuotas}`,
      amount,
      date,
      accent: true,
    });
  }

  const payRows = payMeta.map((p) => [p.label, formatPrice(p.amount), formatPaymentDate(p.date)]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text('Calendario de pagos', margin, y);
  y += 3.5;

  autoTable(doc, {
    ...tableBase,
    startY: y,
    margin: { left: margin, right: margin, bottom: TABLE_MARGIN_BOTTOM },
    head: [['Concepto', 'Monto', 'Fecha']],
    body: payRows,
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'normal' },
      1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'normal' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      data.cell.styles.fillColor = data.row.index % 2 === 0 ? PDF.cream : PDF.white;
      if (data.column.index === 1) {
        const useAccent = payMeta[data.row.index]?.accent;
        data.cell.styles.textColor = useAccent ? PDF.accent : PDF.ink;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // ── Financiamiento bancario (referencia) ─────────────────────────
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

  const finRows = [
    [`Tasa nominal anual (${plazoPdf} años, USD)`, `${tasaPdf.toFixed(2).replace(/\.?0+$/, '')}%`],
    ['Ingreso neto familiar requerido (ref.)', formatPrice(bankFin.ingresoRequerido)],
    [`Cuota bancaria aprox. (${plazoPdf} años)`, formatPrice(bankFin.cuotaBancaria)],
    ['Cuota de mantenimiento aprox.', formatPrice(mantPdf)],
    ['Total gastos mensuales (ref.)', formatPrice(bankFin.totalGastosMensuales)],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF.ink);
  doc.text('Financiamiento bancario (referencia)', margin, y);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF.muted);
  doc.text('Estimaciones orientativas; condiciones sujetas a aprobación bancaria.', margin, y);
  y += 4;

  autoTable(doc, {
    ...tableBase,
    startY: y,
    margin: { left: margin, right: margin, bottom: TABLE_MARGIN_BOTTOM },
    head: [['Concepto', 'Valor']],
    body: finRows,
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'normal' },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      data.cell.styles.fillColor = data.row.index % 2 === 0 ? PDF.cream : PDF.white;
      const label = finRows[data.row.index]?.[0] || '';
      if (data.column.index === 1 && (label.includes('Cuota bancaria') || label.includes('Total gastos'))) {
        data.cell.styles.textColor = PDF.accent;
      } else if (data.column.index === 1) {
        data.cell.styles.textColor = PDF.ink;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...PDF.muted);
  doc.text(PDF_COPY.disclaimer, pageW / 2, y, { align: 'center', maxWidth: pageW - margin * 2 });

  applyFooters(doc, pageW, pageH, margin);

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Cotizacion_KHAYA_${unit.code}_${dateStr}.pdf`);
}

/** Evita aceptar index.html (200) del dev server cuando falta el archivo en public/. */
function blobLooksLikeImage(blob) {
  const ct = (blob.type || '').toLowerCase();
  if (ct.includes('html') || ct.includes('json')) return false;
  if (ct.startsWith('image/')) return true;
  if (ct === 'application/octet-stream' || ct === '') return true;
  return false;
}

function magicBytesAreImage(u8) {
  if (!u8 || u8.length < 4) return false;
  if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return true;
  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return true;
  if (u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return true;
  if (u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) return true;
  return false;
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${url}`);
  const blob = await response.blob();
  if (!blobLooksLikeImage(blob)) {
    throw new Error(`Not an image response: ${url} (${blob.type || 'no type'})`);
  }
  const head = await blob.slice(0, 16).arrayBuffer();
  const u8 = new Uint8Array(head);
  const ct = (blob.type || '').toLowerCase();
  if (!ct.startsWith('image/') && !magicBytesAreImage(u8)) {
    throw new Error(`Not image bytes: ${url}`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * WebP / AVIF / tipo UNKNOWN: jsPDF no los soporta bien en getImageProperties/addImage.
 * Decodifica en el navegador y exporta PNG para el PDF.
 */
function dataUrlToPngViaCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas 2d'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('decode image'));
    img.src = dataUrl;
  });
}

/**
 * Devuelve data URL y formato válidos para doc.addImage (PNG o JPEG).
 */
async function preparePdfImageData(doc, dataUrl) {
  let props;
  try {
    props = doc.getImageProperties(dataUrl);
  } catch {
    props = { fileType: 'UNKNOWN', width: 1, height: 1 };
  }
  const ft = String(props.fileType || '').toUpperCase();
  if (ft === 'PNG' || ft === 'JPEG') {
    return { dataUrl, format: ft === 'JPEG' ? 'JPEG' : 'PNG', props };
  }
  const pngUrl = await dataUrlToPngViaCanvas(dataUrl);
  props = doc.getImageProperties(pngUrl);
  return { dataUrl: pngUrl, format: 'PNG', props };
}

/** Confirma que el navegador puede decodificar la imagen (evita data URL basura). */
function assertImageDataUrlDecodes(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 2 || img.naturalHeight < 2) {
        reject(new Error('image too small'));
        return;
      }
      resolve();
    };
    img.onerror = () => reject(new Error('decode'));
    img.src = dataUrl;
  });
}

/** Prueba varias rutas hasta que una sea una imagen real y decodificable. */
async function fetchFirstImageFromCandidates(paths) {
  for (const name of paths) {
    try {
      const data = await fetchImageAsBase64(assetUrl(name));
      await assertImageDataUrlDecodes(data);
      return { data, name };
    } catch {
      /* siguiente candidato */
    }
  }
  return null;
}

function fitImageToMaxBox(imgWidthPx, imgHeightPx, maxWmm, maxHmm) {
  const ar = imgWidthPx / imgHeightPx;
  let imgW = maxWmm;
  let imgH = imgW / ar;
  if (imgH > maxHmm) {
    imgH = maxHmm;
    imgW = imgH * ar;
  }
  return { imgW, imgH };
}
