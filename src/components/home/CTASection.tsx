
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoWhite from '@/assets/logo_white.png';

const CTASection = () => {
  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="group cursor-default mb-8">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-white mb-6 transition-all duration-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3a0caa] group-hover:to-[#710db2] group-hover:bg-clip-text">
            COMIENZA AHORA CON
            <br />
            <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">
              OndAI
            </span>
            <br />
            Y TRANSFORMA TU NEGOCIO
          </h2>
        </div>
        
        <p className="text-lg font-mono text-zinc-300 mb-12 max-w-2xl mx-auto tracking-wide opacity-80 hover:opacity-100 transition-opacity duration-300">
          Únete a cientos de empresas que ya automatizaron su atención al cliente
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/auth" className="group">
            <button className="relative px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-[#3a0caa] bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white hover:from-[#270a59] hover:to-[#2b0a63] transition-all duration-300 overflow-hidden transform hover:scale-105 hover:shadow-2xl hover:shadow-[#3a0caa]/25">
              <span className="relative z-10 flex items-center justify-center gap-2">
                COMENZAR GRATIS
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#710db2] to-[#3a0caa] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </Link>
          
          <button className="px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-600 text-zinc-300 hover:border-[#3a0caa] hover:text-[#3a0caa] transition-all duration-300 group relative overflow-hidden transform hover:scale-105">
            <span className="relative z-10 border-b border-transparent group-hover:border-[#3a0caa] transition-all duration-300">
              HABLAR CON VENTAS
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-[#3a0caa] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-[#710db2] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
      </div>
    </section>
  );
};

export default CTASection;
