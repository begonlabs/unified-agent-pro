
import React from 'react';
import { MessageSquare } from 'lucide-react';
import logoWhite from '@/assets/logo_white.png';

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-6 group">
              <div className="relative">
                <img src={logoWhite} alt="OndAI Logo" className="h-8 w-8 rounded-lg group-hover:scale-110 transition-all duration-300" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3a0caa] group-hover:to-[#710db2] group-hover:bg-clip-text transition-all duration-300">
                  OndAI
                </span>
                <p className="text-xs text-gray-400 font-medium">Powered by AI</p>
              </div>
            </div>
            <p className="text-sm font-mono text-zinc-400 mb-6 leading-relaxed tracking-wide max-w-md">
              La plataforma de comunicación inteligente que centraliza y automatiza 
              todas tus conversaciones empresariales con IA de última generación.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
              <span>© 2025 OndAI</span>
              <a href="/privacy" className="hover:text-white underline-offset-4 hover:underline">Política de Privacidad</a>
              <a href="/terms" className="hover:text-white underline-offset-4 hover:underline">Términos del Servicio</a>
            </div>
          </div>
          
          <div>
            <h3 className="font-black uppercase tracking-wider text-sm mb-6 text-white">
              PRODUCTO
            </h3>
            <ul className="space-y-3 text-sm font-mono text-zinc-400 tracking-wide">
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  CARACTERÍSTICAS
                </span>
              </li>
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  PRECIOS
                </span>
              </li>
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  API
                </span>
              </li>
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  INTEGRACIONES
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-black uppercase tracking-wider text-sm mb-6 text-white">
              SOPORTE
            </h3>
            <ul className="space-y-3 text-sm font-mono text-zinc-400 tracking-wide">
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  CENTRO DE AYUDA
                </span>
              </li>
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  DOCUMENTACIÓN
                </span>
              </li>
              <li className="hover:text-white transition-colors duration-300">
                <a href="/contact" className="border-b border-transparent hover:border-white transition-all duration-300">
                  CONTACTO
                </a>
              </li>
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  ESTADO DEL SERVICIO
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
