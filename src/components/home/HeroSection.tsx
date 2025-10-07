import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoWhite from '@/assets/logo_white.png';
const HeroSection = () => {
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [matrixText, setMatrixText] = useState('Y AUTOMATIZA');
  const originalText = 'Y AUTOMATIZA';
  const matrixChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
  useEffect(() => {
    if (!isMatrixActive) return;
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      setMatrixText(prevText => prevText.split('').map((char, index) => {
        if (char === ' ') return ' ';
        if (iterations < maxIterations - 5) {
          return matrixChars[Math.floor(Math.random() * matrixChars.length)];
        } else {
          return originalText[index];
        }
      }).join(''));
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setMatrixText(originalText);
        setIsMatrixActive(false);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isMatrixActive]);
  return <section className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{
      animationDelay: '1s'
    }}></div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Logo OndAI en el Hero */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-16 w-16 rounded-lg" />
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              OndAI
            </h1>
            <p className="text-sm text-gray-400 font-medium">Powered by AI</p>
          </div>
        </div>

        <Badge className="mb-8 bg-[#710db2]/20 text-[#710db2] border-[#710db2]/30 hover:bg-[#710db2]/30 hover:border-[#710db2] transition-all duration-300 backdrop-blur-sm px-6 py-2">
          <Zap className="h-4 w-4 mr-2" />
          <span className="font-mono text-sm tracking-wider">7 DÍAS GRATIS + 50% DESCUENTO</span>
        </Badge>
        
        <h2 className="text-4xl lg:text-6xl xl:text-7xl font-black uppercase tracking-widest text-white mb-8 leading-[0.9] group cursor-default">
          <span className="block transition-all duration-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3a0caa] group-hover:to-[#710db2] group-hover:bg-clip-text">CENTRALIZA</span>
          <span onMouseEnter={() => setIsMatrixActive(true)} className="block text-zinc-400 transition-all duration-700 text-transparent bg-gradient-to-r from-[#710db2] to-[#3a0caa] bg-clip-text cursor-pointer">
            {matrixText}
          </span>
          <span className="block text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">TUS CONVERSACIONES</span>
        </h2>
        
        <p className="text-lg lg:text-xl font-mono text-zinc-300 mb-12 max-w-3xl mx-auto leading-relaxed tracking-wide opacity-80 hover:opacity-100 transition-opacity duration-300">
          Unifica WhatsApp, Facebook e Instagram en una sola plataforma.<br />
          Automatiza con IA avanzada y multiplica tu eficiencia operativa.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
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
              VER DEMO
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[{
          value: "94.5%",
          label: "TASA DE RESPUESTA",
          color: "text-[#3a0caa]"
        }, {
          value: "67%",
          label: "AUTOMATIZACIÓN",
          color: "text-[#710db2]"
        }, {
          value: "10x",
          label: "MÁS EFICIENCIA",
          color: "text-[#3a0caa]"
        }].map((stat, index) => <div key={index} className="text-center group cursor-pointer">
              <div className={`text-4xl lg:text-5xl font-black uppercase tracking-widest ${stat.color} mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3a0caa] group-hover:to-[#710db2] group-hover:bg-clip-text`}>
                {stat.value}
              </div>
              <div className="text-sm font-mono tracking-wider text-zinc-400 uppercase group-hover:text-zinc-300 transition-colors duration-300">
                {stat.label}
              </div>
            </div>)}
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#3a0caa] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-20 right-10 w-3 h-3 bg-[#710db2] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
      </div>
    </section>;
};
export default HeroSection;