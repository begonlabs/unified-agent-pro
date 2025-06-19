
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
}

const AdminSidebar = ({ onSignOut }: AdminSidebarProps) => {
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
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 bg-orange-50 rounded-md border border-orange-200">
              <Users className="h-4 w-4 text-orange-600" />
              <span>Gestión de Clientes</span>
            </div>
            
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
              <BarChart3 className="h-4 w-4" />
              <span>Estadísticas Generales</span>
            </div>
            
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
              <UserCheck className="h-4 w-4" />
              <span>Stats por Cliente</span>
            </div>
            
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
              <MessageSquare className="h-4 w-4" />
              <span>Gestión de Soporte</span>
            </div>
            
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </div>
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

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
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
