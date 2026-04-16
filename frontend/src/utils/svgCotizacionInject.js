/**
 * Sustituye textos dinámicos en plantillas SVG exportadas desde Illustrator con <text> editables.
 * Se identifican nodos por `transform="translate(tx ty)"` (tolerancia subpíxel).
 */

import { towerLetterFromUnit } from './floorPlanLayout';

function parseTranslate(transform) {
  if (!transform) return null;
  const m = String(transform).match(/translate\(\s*([\d.+-]+)\s+([\d.+-]+)\s*\)/);
  if (!m) return null;
  return { tx: parseFloat(m[1]), ty: parseFloat(m[2]) };
}

function near(a, b, eps = 0.75) {
  return Math.abs(a - b) <= eps;
}

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Reemplaza el contenido de un <text> por un solo <tspan> (compatible con svg2pdf). */
export function setTextPlainContent(textEl, plain, letterSpacing = '0') {
  const fs = textEl.getAttribute('font-size') || '9';
  const ls = letterSpacing === '0' || letterSpacing === 'normal' ? '0' : letterSpacing;
  textEl.innerHTML = `<tspan x="0" y="0" letter-spacing="${ls}">${escapeXmlText(plain)}</tspan>`;
  textEl.setAttribute('font-size', fs);
  textEl.removeAttribute('letter-spacing');
}

/** Entrega: prefijo marrón + fecha en acento #ee7e0c (Semibold, más grande), alineado a la derecha como en Illustrator. */
function setEntregaTextStyled(textEl, deliveryTrimmed) {
  const prefix = 'Entrega en ';
  const book = `SharpSansNo1, &apos;Sharp Sans No1&apos;`;
  const semi = `SharpSansNo1, &apos;Sharp Sans No1&apos;`;
  if (!deliveryTrimmed) {
    setTextPlainContent(textEl, 'Entrega', '0');
    return;
  }
  textEl.setAttribute('fill', '#654a3b');
  textEl.setAttribute('font-family', `SharpSansNo1, 'Sharp Sans No1'`);
  textEl.setAttribute('font-size', '9');
  textEl.setAttribute('font-weight', 'normal');
  /** Mismo font-size en ambos tspans (evita solapamiento vertical en svg2pdf). `dy="0"` en el segundo tspan evita que algunos renderers reinicien la línea encima de la fecha. */
  textEl.setAttribute('dominant-baseline', 'alphabetic');
  /** `dx` separa la fecha del prefijo (evita “eMayo” en svg2pdf). */
  textEl.innerHTML = `<tspan x="0" y="0" letter-spacing="0" fill="#654a3b" font-family="${book}" font-size="9" font-weight="normal">${escapeXmlText(prefix)}</tspan><tspan dy="0" dx="12" fill="#ee7e0c" font-family="${semi}" font-size="9" font-weight="600" letter-spacing=".05em">${escapeXmlText(deliveryTrimmed)}</tspan>`;
}

/**
 * Illustrator exporta muchas etiquetas como varios <tspan> con letter-spacing;
 * svg2pdf aplica el interletraje entre cada carácter → "O P CIÓN". Unimos líneas
 * de una sola base y fijamos letter-spacing="0".
 */
export function consolidateSvgTextForPdf(svgEl) {
  svgEl.querySelectorAll('text').forEach((textEl) => {
    if (textEl.id === 'pdf-entrega') return;
    textEl.removeAttribute('letter-spacing');
    const tspans = Array.from(textEl.querySelectorAll('tspan'));
    if (tspans.length === 0) return;
    if (tspans.some((t) => t.getAttribute('dy'))) {
      tspans.forEach((t) => t.setAttribute('letter-spacing', '0'));
      return;
    }
    const firstY = tspans[0].getAttribute('y') || '0';
    const sameLine = tspans.every((t) => (t.getAttribute('y') || '0') === firstY);
    if (!sameLine) {
      tspans.forEach((t) => t.setAttribute('letter-spacing', '0'));
      return;
    }
    const full = tspans.map((t) => t.textContent ?? '').join('');
    const x0 = tspans[0].getAttribute('x') || '0';
    const y0 = tspans[0].getAttribute('y') || '0';
    textEl.innerHTML = `<tspan x="${x0}" y="${y0}" letter-spacing="0">${escapeXmlText(full)}</tspan>`;
  });
}

function findTextByTranslate(svgEl, tx, ty) {
  const texts = svgEl.querySelectorAll('text');
  for (let i = 0; i < texts.length; i += 1) {
    const p = parseTranslate(texts[i].getAttribute('transform'));
    if (p && near(p.tx, tx) && near(p.ty, ty)) return texts[i];
  }
  return null;
}

function collectByTranslateX(svgEl, txExpected, fillFilter) {
  const out = [];
  svgEl.querySelectorAll('text').forEach((el) => {
    const p = parseTranslate(el.getAttribute('transform'));
    if (!p || !near(p.tx, txExpected)) return;
    if (fillFilter && el.getAttribute('fill') !== fillFilter) return;
    out.push({ el, ty: p.ty });
  });
  out.sort((a, b) => a.ty - b.ty);
  return out.map((x) => x.el);
}

/**
 * Página 1 (cotizacion-01.svg): montos, fecha, unidad, torre, áreas, piso/ubicación/vista.
 */
export function injectCotizacionPage1(svgEl, unit, salesPlan, helpers) {
  const {
    formatPrice,
    formatDateLong,
    formatM2,
    primaPctLabel,
    detailPlanDataUrl,
  } = helpers;

  const marco = [...svgEl.querySelectorAll('rect')].find((r) => (r.getAttribute('fill') || '').toLowerCase() === '#faf4f0');
  const vectorLayer = svgEl.querySelector('#pdf-planta-vector-art');
  const entregaEl = svgEl.querySelector('#pdf-entrega');

  /**
   * Plano detalle: ancho casi todo el ancho útil del recuadro beige; alto = hasta justo antes de la línea Entrega.
   * Subir el bloque = menor `y` (más hueco vertical → imagen más grande con preserveAspectRatio meet).
   */
  const PLANTA_DETALLE_RIGHT = 554;
  /** Base 460; el tamaño visible se reduce un 15% (×0.85) en ancho y alto. */
  const PLANTA_DETALLE_WIDTH_BASE = 460;
  const PLANTA_DETALLE_SCALE = 0.85;
  const PLANTA_ENTREGA_BASELINE_Y = 466.37;
  /** Borde superior del `<image>` del plano (unidades SVG ≈ px en la cotización). */
  const PLANTA_DETALLE_TOP = 293;
  const GAP_PLANO_ENTREGA_PX = 2;
  const plantaHeightSlot = Math.round(
    PLANTA_ENTREGA_BASELINE_Y - PLANTA_DETALLE_TOP - GAP_PLANO_ENTREGA_PX,
  );
  const PLANTA_DETALLE_WIDTH = Math.round(PLANTA_DETALLE_WIDTH_BASE * PLANTA_DETALLE_SCALE);
  const PLANTA_DETALLE_HEIGHT = Math.max(
    48,
    Math.round(plantaHeightSlot * PLANTA_DETALLE_SCALE),
  );
  const PLANTA_DETALLE_BOX = {
    x: PLANTA_DETALLE_RIGHT - PLANTA_DETALLE_WIDTH,
    y: PLANTA_DETALLE_TOP,
    width: PLANTA_DETALLE_WIDTH,
    height: PLANTA_DETALLE_HEIGHT,
  };
  /** Alineación a la derecha del bloque inferior; un poco más a la izquierda que 544 para no pegar la fecha al borde del plano. */
  const ENTREGA_ANCHOR_X = 528;

  if (detailPlanDataUrl && marco) {
    let im = svgEl.querySelector('#pdf-planta-detalle');
    if (!im) {
      im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      im.setAttribute('id', 'pdf-planta-detalle');
    }
    im.setAttribute('x', String(PLANTA_DETALLE_BOX.x));
    im.setAttribute('y', String(PLANTA_DETALLE_BOX.y));
    im.setAttribute('width', String(PLANTA_DETALLE_BOX.width));
    im.setAttribute('height', String(PLANTA_DETALLE_BOX.height));
    im.setAttribute('preserveAspectRatio', 'xMaxYMid meet');
    im.setAttribute('href', detailPlanDataUrl);
    im.setAttributeNS('http://www.w3.org/1999/xlink', 'href', detailPlanDataUrl);
    im.setAttribute('opacity', '1');
    /** El raster debe ir *antes* que #pdf-entrega en el DOM; si no, el plano tapa el texto. */
    if (entregaEl?.parentNode) {
      entregaEl.parentNode.insertBefore(im, entregaEl);
    } else if (vectorLayer?.parentNode) {
      vectorLayer.parentNode.insertBefore(im, vectorLayer.nextSibling);
    } else {
      marco.after(im);
    }
    if (vectorLayer) vectorLayer.setAttribute('display', 'none');
    /** El raster queda encima en pintura si va después en el DOM; #pdf-amenities-row debe ir *después* del raster (como con Entrega). */
    const amenitiesRow = svgEl.querySelector('#pdf-amenities-row');
    if (amenitiesRow?.parentNode && svgEl.querySelector('#pdf-planta-detalle') === im) {
      im.after(amenitiesRow);
    }
  } else {
    const existing = svgEl.querySelector('#pdf-planta-detalle');
    existing?.parentNode?.removeChild(existing);
    if (vectorLayer) vectorLayer.removeAttribute('display');
  }

  if (entregaEl) {
    const d = unit.delivery != null ? String(unit.delivery).trim() : '';
    setEntregaTextStyled(entregaEl, d);
    entregaEl.setAttribute('transform', `translate(${ENTREGA_ANCHOR_X} ${PLANTA_ENTREGA_BASELINE_Y})`);
    entregaEl.setAttribute('text-anchor', 'end');
    svgEl.querySelector('#pdf-entrega-vector-static')?.setAttribute('display', 'none');
  }

  const map = [
    [56.75, 589.33, formatPrice(salesPlan.price)],
    [56.75, 628.67, formatPrice(salesPlan.primaTotal)],
    [56.75, 667.76, formatPrice(salesPlan.montoFinanciar)],
    [378.4, 589.33, formatPrice(salesPlan.reserva)],
    [378.4, 630.72, formatPrice(salesPlan.opcionCompra)],
    [378.4, 666.95, `${formatPrice(salesPlan.primaFraccionada)}/MES`],
    [378.4, 702.74, formatPrice(salesPlan.gastosCierre)],
  ];

  map.forEach(([tx, ty, val]) => {
    const n = findTextByTranslate(svgEl, tx, ty);
    if (n) setTextPlainContent(n, val, '0');
  });

  const fecha = findTextByTranslate(svgEl, 60.04, 102.89);
  if (fecha) setTextPlainContent(fecha, formatDateLong(), '0');

  const titleLine = findTextByTranslate(svgEl, 191.66, 279.04);
  if (titleLine) {
    const code = unit.code != null ? String(unit.code).trim() : '';
    setTextPlainContent(titleLine, code ? `APARTAMENTO ${code}` : 'APARTAMENTO', '0');
  }

  const torre = findTextByTranslate(svgEl, 266.91, 302.73);
  if (torre) {
    const letter = towerLetterFromUnit(unit);
    setTextPlainContent(torre, letter ? `TORRE ${letter}` : 'TORRE', '0');
  }

  const aptM2 = salesPlan.aptArea != null ? salesPlan.aptArea : unit.area;
  const parkM2 = salesPlan.parkingM2 != null ? salesPlan.parkingM2 : unit.parkingArea;
  const totalM2 =
    salesPlan.totalAreaM2 != null ? salesPlan.totalAreaM2 : Number(aptM2) + Number(parkM2);

  const m2Amenity = svgEl.querySelector('#pdf-amenity-m2');
  if (m2Amenity) {
    setTextPlainContent(m2Amenity, `${formatM2(aptM2)} m²`, '0');
    m2Amenity.setAttribute('fill', '#ee7e0c');
  }

  const hab = svgEl.querySelector('#pdf-amenity-hab');
  if (hab) {
    const n = unit.bedrooms != null && unit.bedrooms !== '' ? Number(unit.bedrooms) : null;
    const label = n != null && !Number.isNaN(n) ? `${n} Habitacion${n === 1 ? '' : 'es'}` : 'Habitaciones';
    setTextPlainContent(hab, label, '0');
  }
  const ban = svgEl.querySelector('#pdf-amenity-bath');
  if (ban) {
    const n = unit.bathrooms != null && unit.bathrooms !== '' ? Number(unit.bathrooms) : null;
    const label = n != null && !Number.isNaN(n) ? `${n} Baño${n === 1 ? '' : 's'}` : 'Baños';
    setTextPlainContent(ban, label, '0');
  }
  const extra = svgEl.querySelector('#pdf-amenity-extra');
  if (extra) {
    const raw = unit.amenityExtra != null ? String(unit.amenityExtra).trim() : '';
    setTextPlainContent(extra, raw || 'Walk in Closet', '0');
  }

  /** Fila m² / habitaciones / baños / extra: ~5% menos ancho (escala X desde el centro entre columnas). */
  const amenitiesRow = svgEl.querySelector('#pdf-amenities-row');
  if (amenitiesRow) {
    const ax = 235;
    const ay = 382;
    amenitiesRow.setAttribute(
      'transform',
      `translate(${ax} ${ay}) scale(0.95 1) translate(${-ax} ${-ay})`,
    );
  }

  const ubicStr = unit.ubicacion != null ? String(unit.ubicacion).trim() : '';
  const floorPart =
    unit.floor != null && unit.floor !== '' ? `Piso ${unit.floor}` : 'Piso';
  const pisoLine = ubicStr ? `${floorPart} · ${ubicStr}` : floorPart;

  const piso = findTextByTranslate(svgEl, 109.85, 444.65);
  if (piso) setTextPlainContent(piso, pisoLine, '0');

  const ubi = findTextByTranslate(svgEl, 88.2, 451.12);
  if (ubi) ubi.setAttribute('display', 'none');
  svgEl.querySelector('#pdf-check-ubicacion')?.setAttribute('display', 'none');

  const vista = findTextByTranslate(svgEl, 109.85, 466.45);
  if (vista) setTextPlainContent(vista, unit.view ? String(unit.view) : '', '0');

  const a1 = findTextByTranslate(svgEl, 204.27, 428.69);
  if (a1) a1.setAttribute('display', 'none');

  const a2 = findTextByTranslate(svgEl, 226.87, 443.22);
  if (a2) setTextPlainContent(a2, `${formatM2(parkM2)} m² parqueo`, '0');

  const a3 = findTextByTranslate(svgEl, 226.87, 466.37);
  if (a3) setTextPlainContent(a3, `${formatM2(totalM2)} m² totales`, '0');

  const primaLbl = findTextByTranslate(svgEl, 57.34, 615.14);
  if (primaLbl && primaPctLabel) {
    setTextPlainContent(primaLbl, `PRIMA (${primaPctLabel})`, '0');
  }
}

/**
 * Página 2: filas de calendario (mismo número de filas que la plantilla) + financiamiento.
 */
export function injectCotizacionPage2(svgEl, payMeta, finVals, helpers) {
  const { formatPrice, formatPaymentDateSlash } = helpers;

  const finTx = 439.05;
  const finYs = [560.02, 583.79, 607.56, 631.33, 655.11];
  finVals.forEach((val, i) => {
    const n = findTextByTranslate(svgEl, finTx, finYs[i]);
    if (n) setTextPlainContent(n, val, '0');
  });

  const amountEls = collectByTranslateX(svgEl, 248.09, '#ee7e0c');
  const conceptEls = collectByTranslateX(svgEl, 56.04, '#654a3b');
  const dateEls = collectByTranslateX(svgEl, 438.63, '#654a3b');

  const rowCap = Math.min(amountEls.length, conceptEls.length, dateEls.length);
  const paySlice = payMeta.slice(0, rowCap);

  for (let i = 0; i < paySlice.length; i += 1) {
    const p = paySlice[i];
    setTextPlainContent(amountEls[i], formatPrice(p.amount), '0');
    setTextPlainContent(conceptEls[i], p.label, '0');
    setTextPlainContent(dateEls[i], formatPaymentDateSlash(p.date), '0');
  }
  for (let i = paySlice.length; i < rowCap; i += 1) {
    setTextPlainContent(amountEls[i], '', '0');
    setTextPlainContent(conceptEls[i], '', '0');
    setTextPlainContent(dateEls[i], '', '0');
  }
}
