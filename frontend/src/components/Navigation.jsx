import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Navigation = ({ onContactClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      data-testid="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass py-4' : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <a 
          href="/" 
          data-testid="logo-link"
          className="inline-flex items-center opacity-95 hover:opacity-100 transition-opacity"
        >
          <BrandLogo size="nav" />
        </a>

        {/* CTA */}
        <button
          data-testid="nav-contact-btn"
          onClick={onContactClick}
          className="flex items-center gap-2 btn-outline text-xs"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">Contactar</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
