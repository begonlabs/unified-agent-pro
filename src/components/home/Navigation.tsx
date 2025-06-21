
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-zinc-900 rounded-sm">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-widest text-zinc-900">
              CHATBOT AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-all duration-300">
                <span className="border-b border-transparent hover:border-zinc-900 transition-all duration-300">
                  INICIAR SESIÓN
                </span>
              </button>
            </Link>
            <Link to="/auth">
              <button className="px-6 py-2 text-sm font-mono tracking-wider uppercase bg-zinc-900 text-white hover:bg-zinc-700 transition-all duration-300">
                COMENZAR GRATIS
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-zinc-900" />
            ) : (
              <Menu className="h-6 w-6 text-zinc-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 border-t border-zinc-200 mt-4 pt-6">
            <div className="flex flex-col gap-4">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase border border-zinc-300 text-zinc-700">
                  INICIAR SESIÓN
                </button>
              </Link>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full px-6 py-3 text-sm font-mono tracking-wider uppercase bg-zinc-900 text-white">
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
