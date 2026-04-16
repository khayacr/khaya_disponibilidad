/**
 * jsPDF/svg2pdf solo renderiza fuentes registradas con addFont (véase README svg2pdf.js).
 * Las plantillas SVG traen nombres de Illustrator (The Seasons, Sharp Sans); aquí se
 * embeben los TTF de `public/fonts/` (Sharp Sans No1 Book + Semibold).
 */

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return binary;
}

/** Registra Sharp Sans No1 Book (cuerpo) + Semibold (énfasis) desde `public/fonts/`. */
export async function embedKhayaPdfFonts(doc, absoluteFetchUrlForPath) {
  const entries = [
    ['fonts/SharpSansNo1-Book.ttf', 'SharpSansNo1-Book.ttf', 'SharpSansNo1', 'normal'],
    ['fonts/SharpSansNo1-Semibold.ttf', 'SharpSansNo1-Semibold.ttf', 'SharpSansNo1', 'bold'],
  ];
  for (const [relPath, vfsName, fontName, style] of entries) {
    const url = absoluteFetchUrlForPath(relPath);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`No se pudo cargar la fuente para el PDF: ${relPath} (${res.status})`);
    }
    const buf = await res.arrayBuffer();
    doc.addFileToVFS(vfsName, arrayBufferToBinaryString(buf));
    doc.addFont(vfsName, fontName, style);
  }
}

function mapSvgFontFamilyAttribute(ff) {
  const s = String(ff);
  if (/TheSeasons|The Seasons|'The Seasons'|\"The Seasons\"/i.test(s)) {
    return 'SharpSansNo1';
  }
  if (/SharpSans|Sharp Sans|RVMSC|Sharp Sans No/i.test(s)) {
    return 'SharpSansNo1';
  }
  return null;
}

/**
 * Sustituye familias de Illustrator por nombres registrados en jsPDF y normaliza pesos
 * a `normal` | `bold` (lo que svg2pdf + addFont resuelven bien).
 */
export function applyKhayaSvgFontFamilies(svgEl) {
  svgEl.querySelectorAll('[font-family]').forEach((el) => {
    const ff = el.getAttribute('font-family');
    if (!ff) return;
    const mapped = mapSvgFontFamilyAttribute(ff);
    if (mapped) el.setAttribute('font-family', mapped);
  });

  svgEl.querySelectorAll('text, tspan').forEach((el) => {
    const w = el.getAttribute('font-weight');
    if (w == null || w === '') return;
    const lower = String(w).toLowerCase().trim();
    if (lower === 'bold' || lower === 'bolder') {
      el.setAttribute('font-weight', 'bold');
      return;
    }
    const n = parseInt(lower, 10);
    if (!Number.isNaN(n) && n >= 600) {
      el.setAttribute('font-weight', 'bold');
      return;
    }
    el.setAttribute('font-weight', 'normal');
  });
}
