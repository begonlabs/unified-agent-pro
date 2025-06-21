
import React from 'react';
import { MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-white rounded-sm">
                <MessageSquare className="h-6 w-6 text-zinc-900" />
              </div>
              <span className="text-xl font-black uppercase tracking-widest">
                CHATBOT AI
              </span>
            </div>
            <p className="text-sm font-mono text-zinc-400 mb-6 leading-relaxed tracking-wide max-w-md">
              La plataforma de mensajería inteligente que centraliza y automatiza 
              todas tus conversaciones con clientes.
            </p>
            <div className="text-xs font-mono text-zinc-500 tracking-wider uppercase">
              © 2024 CHATBOT AI. TODOS LOS DERECHOS RESERVADOS.
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
              <li className="hover:text-white transition-colors duration-300 cursor-pointer">
                <span className="border-b border-transparent hover:border-white transition-all duration-300">
                  CONTACTO
                </span>
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
