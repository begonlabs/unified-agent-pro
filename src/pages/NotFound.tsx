
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MessageSquare, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="text-center relative z-10 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">CHATBOT AI</h1>
        </div>

        {/* 404 Error */}
        <div className="mb-8">
          <h2 className="text-8xl lg:text-9xl font-black uppercase tracking-widest text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-4">
            404
          </h2>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-widest text-white mb-6">
            PÁGINA NO ENCONTRADA
          </h3>
          <p className="text-lg font-mono text-zinc-300 mb-12 max-w-md mx-auto leading-relaxed tracking-wide opacity-80">
            La página que buscas no existe o ha sido movida a otra ubicación.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/" className="group">
            <button className="relative px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-blue-500 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-300 overflow-hidden transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Home className="h-5 w-5" />
                IR AL INICIO
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="px-8 py-4 text-lg font-mono tracking-wider uppercase border-2 border-zinc-600 text-zinc-300 hover:border-blue-400 hover:text-blue-400 transition-all duration-300 group relative overflow-hidden transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 border-b border-transparent group-hover:border-blue-400 transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
              VOLVER ATRÁS
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>

        {/* Error info */}
        <div className="mt-16 p-6 bg-zinc-800/50 border border-zinc-700 rounded-sm backdrop-blur-sm">
          <p className="text-sm font-mono text-zinc-400 tracking-wide">
            <span className="text-red-400">ERROR:</span> Ruta no encontrada: <span className="text-blue-400">{location.pathname}</span>
          </p>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-20 right-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
    </div>
  );
};

export default NotFound;
