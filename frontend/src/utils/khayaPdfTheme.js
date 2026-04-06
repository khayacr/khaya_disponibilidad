/**
 * Manual de marca KHAYA — tokens para PDF (cotización).
 * Tipografía: jsPDF usa Helvetica (sans geométrica, sustituto de Sharp Sans) y Times (serif, cierre inspiracional).
 */

export const PDF = {
  /** Texto principal y títulos de sección */
  ink: [34, 34, 34],
  /** #222222 */
  inkHex: '#222222',
  /** Naranja — solo montos clave */
  accent: [224, 132, 51],
  /** #e08433 */
  cream: [250, 245, 241],
  /** #faf5f1 */
  line: [208, 208, 208],
  /** #d0d0d0 bordes finos */
  grayBlock: [208, 208, 208],
  white: [255, 255, 255],
  /** Fondo página — casi blanco cálido */
  paper: [252, 251, 249],
  muted: [100, 100, 100],
};

export const PDF_COPY = {
  footerSerif: 'Donde la arquitectura abraza a la persona',
  footerContact: 'khayalatam.com  |  +506 4001-4617',
  disclaimer:
    'Este documento es una cotización informativa y no constituye un contrato de compra-venta.',
};

/** Grosor de trazo para “lujo silencioso” (mm) */
export const PDF_LINE = 0.08;
