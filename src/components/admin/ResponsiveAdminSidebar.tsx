import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare,
  LogOut,
  Shield,
  ArrowLeft,
  Home,
  Menu
} from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import logoWhite from '@/assets/logo_white.png';

interface ResponsiveAdminSidebarProps {
  onSignOut: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ResponsiveAdminSidebar = ({ onSignOut, activeTab = 'clients', onTabChange }: ResponsiveAdminSidebarProps) => {
  const navigate = useNavigate();
  const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar();
  const [isMenuActive, setIsMenuActive] = useState(false);
  
  // Efecto para volver a semitransparente después de unos segundos
  useEffect(() => {
    if (isMenuActive) {
      const timer = setTimeout(() => {
        setIsMenuActive(false);
      }, 3000); // 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isMenuActive]);
  
  const menuItems = [
    { id: 'clients', title: 'Gestión de Clientes', icon: Users },
    { id: 'general-stats', title: 'Estadísticas Generales', icon: BarChart3 },
    { id: 'client-stats', title: 'Stats por Cliente', icon: UserCheck },
    { id: 'support', title: 'Gestión de Soporte', icon: MessageSquare },
    { id: 'settings', title: 'Configuración', icon: Settings },
  ];

  const handleMenuClick = (itemId: string) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    closeSidebar();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
    closeSidebar();
  };

  const SidebarContent = () => (
    <div className="w-72 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Panel Admin</h1>
            <p className="text-xs sm:text-sm text-white/80">
              Gestión de la Plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="px-2 sm:px-3 py-1 sm:py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administración
            </h3>
          </div>
          
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'text-[#3a0caa] bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 border border-[#3a0caa]/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#3a0caa]' : ''}`} />
                  <span className="hidden sm:inline">{item.title}</span>
                  <span className="sm:hidden">{item.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Status */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5">
        <div className="flex items-center gap-1 sm:gap-2 text-sm font-medium text-[#3a0caa] mb-2 sm:mb-3">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Modo Administrador</span>
          <span className="sm:hidden">Admin</span>
        </div>
        <p className="text-xs text-[#3a0caa]/70 hidden sm:block">
          Tienes acceso completo a todas las funciones administrativas de la plataforma.
        </p>
      </div>

      {/* Navigation Actions */}
      <div className="p-3 sm:p-4 border-t border-gray-200 space-y-1 sm:space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 sm:gap-3 text-[#3a0caa] hover:bg-[#3a0caa]/10 border-[#3a0caa]/20 hover:border-[#3a0caa]/30 text-sm sm:text-base h-9 sm:h-10"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Volver al Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-2 sm:gap-3 text-gray-700 hover:bg-gray-50 text-sm sm:text-base h-9 sm:h-10"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Cerrar Sesión Admin</span>
          <span className="sm:hidden">Salir</span>
        </Button>
      </div>
    </div>
  );

  // Desktop Sidebar (fixed)
  if (!isMobile) {
    return (
      <div className="sticky top-0 h-screen">
        <SidebarContent />
      </div>
    );
  }

  // Mobile Sidebar (drawer)
  return (
    <Sheet open={isOpen} onOpenChange={toggleSidebar}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMenuActive(true)}
          className={`fixed top-2 left-0 z-50 lg:hidden shadow-lg hover:shadow-xl rounded-l-none rounded-r-lg p-2 transition-all duration-300 ${
            isMenuActive 
              ? 'bg-white opacity-100' 
              : 'bg-white/70 opacity-70 hover:opacity-100'
          }`}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
};

export default ResponsiveAdminSidebar;
