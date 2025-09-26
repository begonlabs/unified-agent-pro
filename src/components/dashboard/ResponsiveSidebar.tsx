import React, { useState, useEffect } from 'react';
import { User as UserType } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Users,
  BarChart3, 
  Settings, 
  User, 
  HelpCircle, 
  Bot,
  LogOut,
  Phone,
  Instagram,
  Facebook,
  Waves,
  Sparkles,
  Shield,
  Crown,
  Loader2,
  Menu
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useChannelsStatus } from '@/hooks/useChannelsStatus';
import { useSidebar } from '@/hooks/useSidebar';
import logoWhite from '@/assets/logo_white.png';

interface ResponsiveSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSignOut: () => void;
  user: UserType | null;
}

const ResponsiveSidebar = ({ currentView, setCurrentView, onSignOut, user }: ResponsiveSidebarProps) => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const { status: channelsStatus, loading: channelsLoading } = useChannelsStatus();
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
    { id: 'ai-agent', label: 'Mi Agente IA', icon: Bot },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'crm', label: 'CRM Clientes', icon: Users },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'channels', label: 'Canales', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'support', label: 'Soporte', icon: HelpCircle },
  ];

  const handleAdminAccess = () => {
    navigate('/admin');
    closeSidebar();
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    closeSidebar();
  };

  const SidebarContent = () => (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Header - Simplified for mobile */}
      <div className="p-3 sm:p-6 border-b bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5">
        <div className="flex items-center gap-2 sm:gap-3 group">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-all duration-300" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text group-hover:from-[#270a59] group-hover:to-[#2b0a63] transition-all duration-300">
              OndAI
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">Powered by AI</p>
          </div>
        </div>
      </div>

      {/* Navigation - Optimized for mobile */}
      <nav className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-2 sm:gap-3 text-sm sm:text-base h-9 sm:h-11"
              onClick={() => {
                handleViewChange(item.id);
              }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">
                {item.id === 'ai-agent' ? 'Agente IA' : 
                 item.id === 'crm' ? 'CRM' :
                 item.label.split(' ')[0]}
              </span>
            </Button>
          );
        })}
      </nav>

      {/* Admin Access Section - Simplified */}
      {!adminLoading && isAdmin && (
        <div className="p-2 sm:p-4 border-t border-[#3a0caa]/20 bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5">
          <Button
            onClick={handleAdminAccess}
            className="w-full justify-start gap-2 sm:gap-3 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base h-9 sm:h-10"
          >
            <Shield className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Administración</span>
            <span className="sm:hidden">Admin</span>
          </Button>
        </div>
      )}

      {/* Quick Channel Status - Compact for mobile */}
      <div className="p-2 sm:p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5">
        <h3 className="text-xs sm:text-sm font-semibold text-[#3a0caa] mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-full"></div>
          <span className="hidden sm:inline">Canales Conectados</span>
          <span className="sm:hidden">Canales</span>
        </h3>
        
        {channelsLoading ? (
          <div className="flex items-center justify-center py-1 sm:py-4">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-600" />
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600">Cargando...</span>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1 sm:p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-[#3a0caa]" />
              <span className="font-medium">WhatsApp</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.whatsapp 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1 sm:p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Facebook className="h-3 w-3 sm:h-4 sm:w-4 text-[#710db2]" />
              <span className="font-medium">Facebook</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.facebook 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1 sm:p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Instagram className="h-3 w-3 sm:h-4 sm:w-4 text-pink-600" />
              <span className="font-medium">Instagram</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.instagram 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out - Always visible */}
      <div className="p-2 sm:p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5 flex-shrink-0">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 sm:gap-3 text-[#3a0caa] hover:bg-[#3a0caa]/10 border-[#3a0caa]/20 hover:border-[#3a0caa]/30 transition-all duration-300 text-sm sm:text-base h-9 sm:h-10"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
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
      <SheetContent side="left" className="p-0 w-64">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
};

export default ResponsiveSidebar;
