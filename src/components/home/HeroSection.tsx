
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-stone-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <Badge className="mb-8 bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200 transition-colors duration-300">
          <span className="font-mono text-xs tracking-wider">🚀 7 DÍAS GRATIS + 50% DESCUENTO</span>
        </Badge>
        
        <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black uppercase tracking-widest text-zinc-900 mb-8 leading-[0.9]">
          <span className="block">CENTRALIZA</span>
          <span className="block text-zinc-600">Y AUTOMATIZA</span>
          <span className="block text-zinc-900">TUS CONVERSACIONES</span>
        </h1>
        
        <p className="text-lg lg:text-xl font-mono text-zinc-600 mb-12 max-w-3xl mx-auto leading-relaxed tracking-wide">
          Unifica WhatsApp, Facebook e Instagram en una sola plataforma.<br />
          Automatiza con IA avanzada y multiplica tu eficiencia operativa.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link to="/auth" className="group">
            <button className="relative px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-transparent hover:text-zinc-900 transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                COMENZAR GRATIS
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </Link>
          
          <button className="px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300 group">
            <span className="border-b border-transparent group-hover:border-zinc-900 transition-all duration-300">
              VER DEMO
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[
            { value: "94.5%", label: "TASA DE RESPUESTA", color: "text-blue-600" },
            { value: "67%", label: "AUTOMATIZACIÓN", color: "text-emerald-600" },
            { value: "10x", label: "MÁS EFICIENCIA", color: "text-violet-600" }
          ].map((stat, index) => (
            <div key={index} className="text-center group cursor-pointer">
              <div className={`text-4xl lg:text-5xl font-black uppercase tracking-widest ${stat.color} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                {stat.value}
              </div>
              <div className="text-sm font-mono tracking-wider text-zinc-600 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
