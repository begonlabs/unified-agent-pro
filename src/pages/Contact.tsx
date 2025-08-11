import React from 'react';
import { Link } from 'react-router-dom';
import ContactSection from '@/components/home/ContactSection';
import { ArrowLeft, Waves, Sparkles } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header simple con branding y botón volver */}
      <div className="px-6 pt-8">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm relative">
          <Link to="/" className="absolute -top-4 -left-4">
            <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Volver al inicio</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-white/10 rounded-xl">
                <Waves className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Contacto</h1>
              <p className="text-white/80 text-sm">Soporte, dudas y eliminación de datos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main>
        <ContactSection />
      </main>
    </div>
  );
};

export default Contact;

