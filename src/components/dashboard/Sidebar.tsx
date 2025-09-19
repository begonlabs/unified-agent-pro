import React from 'react';
import { User as UserType } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Loader2
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useChannelsStatus } from '@/hooks/useChannelsStatus';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSignOut: () => void;
  user: UserType | null;
}

const Sidebar = ({ currentView, setCurrentView, onSignOut, user }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const { status: channelsStatus, loading: channelsLoading } = useChannelsStatus();
  
  const menuItems = [
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'crm', label: 'CRM Clientes', icon: Users },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'channels', label: 'Canales', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'support', label: 'Soporte', icon: HelpCircle },
    { id: 'ai-agent', label: 'Mi Agente IA', icon: Bot },
  ];

  const handleAdminAccess = () => {
    navigate('/admin');
  };

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300 transform group-hover:scale-110">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
              OndAI
            </h1>
            <p className="text-sm text-gray-500 font-medium">Powered by AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => {
                console.log(`🎯 Sidebar: Clicked on ${item.id} (${item.label})`);
                setCurrentView(item.id);
              }}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Admin Access Section */}
      {!adminLoading && isAdmin && (
        <div className="p-4 border-t border-orange-200 bg-gradient-to-b from-orange-50 to-orange-100">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <Crown className="h-4 w-4 text-orange-600" />
              Panel Admin
            </h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
              Administrador
            </Badge>
          </div>
          <Button
            onClick={handleAdminAccess}
            className="w-full justify-start gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Shield className="h-4 w-4" />
            Dashboard Admin
          </Button>
          <p className="text-xs text-orange-600 mt-2 leading-relaxed">
            Acceso completo a la gestión de la plataforma
          </p>
        </div>
      )}

      {/* Quick Channel Status */}
      <div className="p-4 border-t bg-gradient-to-b from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          Canales Conectados
        </h3>
        
        {channelsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Cargando...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="font-medium">WhatsApp</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.whatsapp 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Facebook</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.facebook 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <Instagram className="h-4 w-4 text-pink-600" />
              <span className="font-medium">Instagram</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.instagram 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t bg-gradient-to-b from-white to-gray-50">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-300"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;