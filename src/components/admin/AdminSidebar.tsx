
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare,
  LogOut,
  Shield
} from 'lucide-react';

interface AdminSidebarProps {
  onSignOut: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const AdminSidebar = ({ onSignOut, activeTab = 'clients', onTabChange }: AdminSidebarProps) => {
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
  };

  return (
    <div className="w-72 bg-zinc-800/50 border-r border-zinc-700 backdrop-blur-sm h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-700 bg-gradient-to-r from-red-600/20 to-orange-600/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-sm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">PANEL ADMIN</h1>
            <p className="text-sm font-mono text-zinc-400 tracking-wide">
              Gestión de la Plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          <div className="px-3 py-2">
            <h3 className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-mono tracking-wider rounded-sm transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-transparent hover:border-zinc-600'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-red-400' : ''}`} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Status */}
      <div className="p-4 border-t border-zinc-700 bg-red-600/10">
        <div className="flex items-center gap-2 text-sm font-mono font-medium text-red-400 mb-3 uppercase tracking-wider">
          <Shield className="h-4 w-4" />
          Modo Administrador
        </div>
        <p className="text-xs font-mono text-zinc-400 tracking-wide">
          Tienes acceso completo a todas las funciones administrativas de la plataforma.
        </p>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-zinc-700">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-mono tracking-wider uppercase text-zinc-300 hover:text-white border border-zinc-600 hover:border-red-500/50 hover:bg-red-600/10 rounded-sm transition-all duration-300"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión Admin
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
