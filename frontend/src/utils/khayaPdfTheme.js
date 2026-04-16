/**
 * Tokens PDF — Cotización (Ruta Uno / marca).
 * Tipografías en PDF: `embedKhayaPdfFonts` registra Sharp Sans No1 Book + Semibold desde `public/fonts/`.
 * Sin eso, svg2pdf solo usa Times/Helvetica.
 */

export const PDF = {
  ink: [34, 34, 34],
  inkHex: '#222222',
  /** Montos / acentos */
  accent: [238, 126, 12],
  accentHex: '#ee7e0c',
  /** Relleno cajas naranjas (cuadros) */
  cream: [250, 244, 240],
  creamHex: '#faf4f0',
  line: [238, 126, 12],
  white: [255, 255, 255],
  paper: [255, 255, 255],
  muted: [100, 100, 100],
  /** Pie de página */
  footerBg: [172, 142, 120],
  footerHex: '#ac8e78',
};

export const PDF_COPY = {
  footerSerif: 'Donde la arquitectura abraza a la persona',
  footerContact: 'khayalatam.com  |  +506 4001-4617',
  disclaimer:
    'Este documento es una cotización informativa y no constituye un contrato de compra-venta.',
};

/** ~20px a mm (96 CSS px → mm) */
export const BOX_RADIUS_MM = (20 * 25.4) / 96;

/** Grosor borde cajas (mm) */
export const PDF_LINE = 0.35;
