
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <Badge className="mb-8 bg-zinc-800/50 text-blue-400 border-blue-500/30 hover:bg-zinc-700/50 hover:border-blue-400 transition-all duration-300 backdrop-blur-sm">
          <span className="font-mono text-xs tracking-wider">🚀 7 DÍAS GRATIS + 50% DESCUENTO</span>
        </Badge>
        
        <h1 className="text-5xl lg:text-7xl xl:text-8xl font-black uppercase tracking-widest text-white mb-8 leading-[0.9] group cursor-default">
          <span className="block transition-all duration-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text">CENTRALIZA</span>
          <span className="block text-zinc-400 transition-all duration-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text">Y AUTOMATIZA</span>
          <span className="block text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">TUS CONVERSACIONES</span>
        </h1>
        
        <p className="text-lg lg:text-xl font-mono text-zinc-300 mb-12 max-w-3xl mx-auto leading-relaxed tracking-wide opacity-80 hover:opacity-100 transition-opacity duration-300">
          Unifica WhatsApp, Facebook e Instagram en una sola plataforma.<br />
          Automatiza con IA avanzada y multiplica tu eficiencia operativa.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link to="/auth" className="group">
            <button className="relative px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-blue-500 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-300 overflow-hidden transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              <span className="relative z-10 flex items-center justify-center gap-2">
                COMENZAR GRATIS
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </Link>
          
          <button className="px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-600 text-zinc-300 hover:border-blue-400 hover:text-blue-400 transition-all duration-300 group relative overflow-hidden transform hover:scale-105">
            <span className="relative z-10 border-b border-transparent group-hover:border-blue-400 transition-all duration-300">
              VER DEMO
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[
            { value: "94.5%", label: "TASA DE RESPUESTA", color: "text-blue-400" },
            { value: "67%", label: "AUTOMATIZACIÓN", color: "text-emerald-400" },
            { value: "10x", label: "MÁS EFICIENCIA", color: "text-violet-400" }
          ].map((stat, index) => (
            <div key={index} className="text-center group cursor-pointer">
              <div className={`text-4xl lg:text-5xl font-black uppercase tracking-widest ${stat.color} mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text`}>
                {stat.value}
              </div>
              <div className="text-sm font-mono tracking-wider text-zinc-400 uppercase group-hover:text-zinc-300 transition-colors duration-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-20 right-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
      </div>
    </section>
  );
};

export default HeroSection;
