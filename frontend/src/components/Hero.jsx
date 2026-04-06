import { ChevronDown } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const FACADE_IMG = 'https://customer-assets.emergentagent.com/job_3f5022b9-cf53-4fd1-b58d-ff07a94ca1e2/artifacts/bcdp6152_KRU-TorreE-Fachada-001.png';

export const Hero = ({ onExploreClick }) => {
  return (
    <section 
      data-testid="hero-section"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={FACADE_IMG} 
          alt="Fachada de la torre residencial"
          className="w-full h-full object-cover object-center"
          data-testid="hero-facade-image"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Pre-title */}
        <p 
          className="text-xs tracking-[0.3em] uppercase text-[#334155] mb-4 animate-fade-in opacity-0 stagger-1"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Residencias de Lujo
        </p>

        {/* Main brand mark */}
        <div className="flex justify-center mb-6 animate-slide-up opacity-0 stagger-2">
          <BrandLogo size="hero" className="mx-auto" />
        </div>

        {/* Subtitle */}
        <p 
          className="text-lg sm:text-xl lg:text-2xl text-slate-700 font-light mb-12 max-w-2xl mx-auto animate-slide-up opacity-0 stagger-3"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          14 pisos de exclusividad con vistas panorámicas al este y oeste
        </p>

        {/* CTA */}
        <button
          data-testid="explore-availability-btn"
          onClick={onExploreClick}
          className="btn-primary animate-slide-up opacity-0 stagger-4"
        >
          Explorar Disponibilidad
        </button>
      </div>

      {/* Scroll Indicator */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
        onClick={onExploreClick}
        data-testid="scroll-indicator"
      >
        <ChevronDown className="w-8 h-8 text-slate-700/70" />
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 glass py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center animate-fade-in opacity-0 stagger-1">
            <p className="text-3xl lg:text-4xl font-light text-slate-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>14</p>
            <p className="text-xs tracking-[0.2em] uppercase text-slate-600 mt-1">Pisos</p>
          </div>
          <div className="text-center animate-fade-in opacity-0 stagger-2">
            <p className="text-3xl lg:text-4xl font-light text-slate-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>140</p>
            <p className="text-xs tracking-[0.2em] uppercase text-slate-600 mt-1">Unidades</p>
          </div>
          <div className="text-center animate-fade-in opacity-0 stagger-3">
            <p className="text-3xl lg:text-4xl font-light text-slate-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>67-72</p>
            <p className="text-xs tracking-[0.2em] uppercase text-slate-600 mt-1">m² promedio</p>
          </div>
          <div className="text-center animate-fade-in opacity-0 stagger-4">
            <p className="text-3xl lg:text-4xl font-light text-slate-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>2027</p>
            <p className="text-xs tracking-[0.2em] uppercase text-slate-600 mt-1">Entrega</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
