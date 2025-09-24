import React from 'react';
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
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300 transform group-hover:scale-110">
              <Waves className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
              OndAI
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Powered by AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-2 sm:gap-3 text-sm sm:text-base h-10 sm:h-11"
              onClick={() => {
                // Sidebar item clicked
                handleViewChange(item.id);
              }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label.split(' ')[0]}</span>
            </Button>
          );
        })}
      </nav>

      {/* Admin Access Section */}
      {!adminLoading && isAdmin && (
        <div className="p-3 sm:p-4 border-t border-orange-200 bg-gradient-to-b from-orange-50 to-orange-100">
          <div className="mb-2 sm:mb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-orange-700 flex items-center gap-1 sm:gap-2">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              <span className="hidden sm:inline">Panel Admin</span>
              <span className="sm:hidden">Admin</span>
            </h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
              Admin
            </Badge>
          </div>
          <Button
            onClick={handleAdminAccess}
            className="w-full justify-start gap-2 sm:gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base h-9 sm:h-10"
          >
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Dashboard Admin</span>
            <span className="sm:hidden">Admin</span>
          </Button>
          <p className="text-xs text-orange-600 mt-1 sm:mt-2 leading-relaxed hidden sm:block">
            Acceso completo a la gestión de la plataforma
          </p>
        </div>
      )}

      {/* Quick Channel Status */}
      <div className="p-3 sm:p-4 border-t bg-gradient-to-b from-gray-50 to-white">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          <span className="hidden sm:inline">Canales Conectados</span>
          <span className="sm:hidden">Canales</span>
        </h3>
        
        {channelsLoading ? (
          <div className="flex items-center justify-center py-2 sm:py-4">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-600" />
            <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600">Cargando...</span>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="font-medium">WhatsApp</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.whatsapp 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Facebook className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="font-medium">Facebook</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.facebook 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Instagram className="h-3 w-3 sm:h-4 sm:w-4 text-pink-600" />
              <span className="font-medium">Instagram</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ml-auto ${
                channelsStatus.instagram 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="p-3 sm:p-4 border-t bg-gradient-to-b from-white to-gray-50">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 sm:gap-3 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-300 text-sm sm:text-base h-9 sm:h-10"
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
          className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg hover:shadow-xl"
        >
          <Menu className="h-4 w-4" />
          <span className="ml-2">Menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
};

export default ResponsiveSidebar;
