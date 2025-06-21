
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300 transform group-hover:scale-110">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-widest text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
              CHATBOT AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase border border-zinc-600 text-zinc-300 hover:border-blue-400 hover:text-blue-400 transition-all duration-300 group relative overflow-hidden">
                <span className="relative z-10 border-b border-transparent group-hover:border-blue-400 transition-all duration-300">
                  INICIAR SESIÓN
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </Link>
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                COMENZAR GRATIS
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-300 hover:text-blue-400 transition-colors duration-300"
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
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase border border-zinc-600 text-zinc-300 hover:border-blue-400 hover:text-blue-400 transition-all duration-300">
                  INICIAR SESIÓN
                </button>
              </Link>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
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
