
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="py-32 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-white mb-6">
          ¿LISTO PARA TRANSFORMAR
          <br />
          TU NEGOCIO?
        </h2>
        <p className="text-lg font-mono text-zinc-300 mb-12 max-w-2xl mx-auto tracking-wide">
          Únete a cientos de empresas que ya automatizaron su atención al cliente
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/auth" className="group">
            <button className="relative px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-white bg-white text-zinc-900 hover:bg-transparent hover:text-white transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                COMENZAR GRATIS
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-zinc-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </Link>
          
          <button className="px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-600 text-zinc-300 hover:border-white hover:text-white transition-all duration-300 group">
            <span className="border-b border-transparent group-hover:border-white transition-all duration-300">
              HABLAR CON VENTAS
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
