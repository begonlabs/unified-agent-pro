
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare,
  LogOut,
  Shield,
  ArrowLeft,
  Home
} from 'lucide-react';

interface AdminSidebarProps {
  onSignOut: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const AdminSidebar = ({ onSignOut, activeTab = 'clients', onTabChange }: AdminSidebarProps) => {
  const navigate = useNavigate();
  
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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-72 bg-white shadow-lg h-screen flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Panel Admin</h1>
            <p className="text-sm text-orange-100">
              Gestión de la Plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          <div className="px-3 py-2">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'text-orange-700 bg-orange-50 border border-orange-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-orange-600' : ''}`} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Status */}
      <div className="p-4 border-t border-gray-200 bg-orange-50">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-700 mb-3">
          <Shield className="h-4 w-4" />
          Modo Administrador
        </div>
        <p className="text-xs text-orange-600">
          Tienes acceso completo a todas las funciones administrativas de la plataforma.
        </p>
      </div>

      {/* Navigation Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al Dashboard
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-50"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión Admin
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
