const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/khaya_logo.png`;

const SIZE_CLASS = {
  nav: 'h-8 sm:h-9 max-w-[min(200px,55vw)]',
  footer: 'h-10 sm:h-12 max-w-[min(240px,85vw)]',
  hero: 'h-16 sm:h-24 lg:h-32 max-w-[min(420px,92vw)]',
  map: 'h-8 max-w-[min(140px,28vw)]',
};

/**
 * Logo de marca (public/khaya_logo.png) — KHAYA Ruta Uno.
 */
export function BrandLogo({ size = 'nav', className = '' }) {
  const h = SIZE_CLASS[size] || SIZE_CLASS.nav;
  return (
    <img
      src={LOGO_SRC}
      alt="KHAYA Ruta Uno"
      className={`w-auto object-contain object-left ${h} ${className}`}
      decoding="async"
    />
  );
}

export { LOGO_SRC };
