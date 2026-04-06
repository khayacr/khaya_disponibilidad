import { useState, useRef } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import BuildingExplorer from "./components/BuildingExplorer";
import ContactForm from "./components/ContactForm";
import { BrandLogo } from "./components/BrandLogo";

function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedUnitForContact, setSelectedUnitForContact] = useState(null);
  const explorerRef = useRef(null);

  const handleExploreClick = () => {
    const explorerSection = document.querySelector('[data-testid="building-explorer"]');
    if (explorerSection) {
      explorerSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactClick = (unit = null) => {
    setSelectedUnitForContact(unit);
    setIsContactOpen(true);
  };

  return (
    <div className="App min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <Navigation onContactClick={() => handleContactClick(null)} />

      {/* Hero Section */}
      <Hero onExploreClick={handleExploreClick} />

      {/* Building Explorer */}
      <BuildingExplorer 
        ref={explorerRef}
        onContactClick={handleContactClick}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-black/10 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="mb-4">
                <BrandLogo size="footer" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Residencias de lujo con vistas panorámicas. 
                14 pisos de exclusividad y confort.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">
                Enlaces
              </p>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={handleExploreClick}
                    className="text-sm text-gray-400 hover:text-[#644939] transition-colors"
                  >
                    Explorar unidades
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleContactClick(null)}
                    className="text-sm text-gray-400 hover:text-[#644939] transition-colors"
                  >
                    Contactar
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-4">
                Contacto
              </p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>info@khayalatam.com</p>
                <p>+506 4001-4617</p>
                <p>www.khayalatam.com</p>
                <p>@khayalatam</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Form Sheet */}
      <ContactForm
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        selectedUnit={selectedUnitForContact}
      />

      <Toaster position="bottom-right" theme="light" richColors />
    </div>
  );
}

export default App;
