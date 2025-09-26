import React from 'react';
import { User as UserType } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logoWhite from '@/assets/logo_white.png';
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
  };

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-[#3a0caa]/5 to-[#710db2]/5">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-8 w-8 group-hover:scale-110 transition-all duration-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text group-hover:from-[#270a59] group-hover:to-[#2b0a63] transition-all duration-300">
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
                // Sidebar item clicked
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
        <div className="p-4 border-t border-[#3a0caa]/20 bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#3a0caa] flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#3a0caa]" />
              Panel Admin
            </h3>
            <Badge variant="secondary" className="bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border-[#3a0caa]/20 text-xs">
              Administrador
            </Badge>
          </div>
          <Button
            onClick={handleAdminAccess}
            className="w-full justify-start gap-3 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Shield className="h-4 w-4" />
            Dashboard Admin
          </Button>
          <p className="text-xs text-[#3a0caa] mt-2 leading-relaxed">
            Acceso completo a la gestión de la plataforma
          </p>
        </div>
      )}

      {/* Quick Channel Status */}
      <div className="p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5">
        <h3 className="text-sm font-semibold text-[#3a0caa] mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-full"></div>
          Canales Conectados
        </h3>
        
        {channelsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-[#3a0caa]" />
            <span className="ml-2 text-sm text-gray-600">Cargando...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Phone className="h-4 w-4 text-[#3a0caa]" />
              <span className="font-medium">WhatsApp</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.whatsapp 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Facebook className="h-4 w-4 text-[#710db2]" />
              <span className="font-medium">Facebook</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.facebook 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200">
              <Instagram className="h-4 w-4 text-pink-600" />
              <span className="font-medium">Instagram</span>
              <div className={`w-2 h-2 rounded-full ml-auto ${
                channelsStatus.instagram 
                  ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                  : 'bg-gray-400'
              }`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-[#3a0caa] hover:bg-[#3a0caa]/10 border-[#3a0caa]/20 hover:border-[#3a0caa]/30 transition-all duration-300"
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