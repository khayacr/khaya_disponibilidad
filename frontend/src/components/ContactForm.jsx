import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Send, Check, Loader2 } from 'lucide-react';

export const ContactForm = ({ isOpen, onClose, selectedUnit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          unit: selectedUnit ? {
            id: selectedUnit.id,
            code: selectedUnit.code,
            floor: selectedUnit.floor,
            apartment: selectedUnit.apartment,
            price: selectedUnit.price
          } : null
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', phone: '', message: '' });
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        data-testid="contact-sheet"
        className="bg-white border-l-black/10 text-slate-900 w-full sm:max-w-md"
      >
        <SheetHeader className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[#e08433] mb-2">
            Solicitar Información
          </p>
          <SheetTitle 
            className="text-3xl font-light text-slate-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Contáctenos
          </SheetTitle>
          <SheetDescription className="sr-only">
            Formulario para solicitar información sobre unidades
          </SheetDescription>
        </SheetHeader>

        {selectedUnit && (
          <div className="mb-6 p-4 bg-slate-50 border border-black/10">
            <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-2">
              Unidad de interés
            </p>
            <p className="text-lg text-slate-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Apartamento {selectedUnit.apartment}, Piso {selectedUnit.floor}
            </p>
            <p className="text-sm text-[#e08433]">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(selectedUnit.price)}
            </p>
          </div>
        )}

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#10b981]" />
            </div>
            <p 
              className="text-2xl font-light text-slate-900 mb-2"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              ¡Mensaje enviado!
            </p>
            <p className="text-sm text-slate-600 text-center">
              Nos pondremos en contacto pronto
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-2 block">
                Nombre completo
              </label>
              <Input
                data-testid="contact-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-transparent border-0 border-b border-black/10 rounded-none px-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#e08433]"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-2 block">
                Email
              </label>
              <Input
                data-testid="contact-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-transparent border-0 border-b border-black/10 rounded-none px-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#e08433]"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-2 block">
                Teléfono
              </label>
              <Input
                data-testid="contact-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="bg-transparent border-0 border-b border-black/10 rounded-none px-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#e08433]"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-2 block">
                Mensaje (opcional)
              </label>
              <Textarea
                data-testid="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="bg-transparent border-black/10 rounded-none text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-[#e08433] resize-none"
                placeholder="¿Tienes alguna pregunta específica?"
              />
            </div>

            <button
              data-testid="contact-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-xs text-gray-600 text-center">
            Al enviar este formulario, aceptas nuestra política de privacidad.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactForm;
