
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoWhite from '@/assets/logo_white.png';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <img src={logoWhite} alt="OndAI Logo" className="h-8 w-8 group-hover:scale-110 transition-all duration-300" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#3a0caa] group-hover:to-[#710db2] group-hover:bg-clip-text transition-all duration-300">
                OndAI
              </span>
              <p className="text-xs text-gray-400 font-medium">Powered by AI</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase border border-zinc-600 text-zinc-300 hover:border-[#3a0caa] hover:text-[#3a0caa] transition-all duration-300 group relative overflow-hidden">
                <span className="relative z-10 border-b border-transparent group-hover:border-[#3a0caa] transition-all duration-300">
                  INICIAR SESIÓN
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </Link>
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white hover:from-[#270a59] hover:to-[#2b0a63] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#3a0caa]/25">
                COMENZAR GRATIS
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-300 hover:text-[#3a0caa] transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 border-t border-zinc-800 mt-4 pt-6 bg-zinc-950/95 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase border border-zinc-600 text-zinc-300 hover:border-[#3a0caa] hover:text-[#3a0caa] transition-all duration-300">
                  INICIAR SESIÓN
                </button>
              </Link>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white hover:from-[#270a59] hover:to-[#2b0a63] transition-all duration-300">
                  COMENZAR GRATIS
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
