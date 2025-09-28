import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare
} from 'lucide-react';
import { AdminMenuItem } from '../types';

export class AdminSidebarService {
  /**
   * Get the default menu items for admin sidebar
   */
  static getMenuItems(): AdminMenuItem[] {
    return [
      { id: 'clients', title: 'Gestión de Clientes', icon: Users },
      { id: 'general-stats', title: 'Estadísticas Generales', icon: BarChart3 },
      { id: 'client-stats', title: 'Stats por Cliente', icon: UserCheck },
      { id: 'support', title: 'Gestión de Soporte', icon: MessageSquare },
      { id: 'settings', title: 'Configuración', icon: Settings },
    ];
  }

  /**
   * Get CSS classes for active menu item
   */
  static getActiveMenuItemClasses(): string {
    return 'text-[#3a0caa] bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 border border-[#3a0caa]/20';
  }

  /**
   * Get CSS classes for inactive menu item
   */
  static getInactiveMenuItemClasses(): string {
    return 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
  }

  /**
   * Get CSS classes for active icon
   */
  static getActiveIconClasses(): string {
    return 'text-[#3a0caa]';
  }

  /**
   * Get CSS classes for button variants
   */
  static getButtonClasses(): {
    base: string;
    hover: string;
    border: string;
  } {
    return {
      base: 'w-full justify-start gap-3 text-[#3a0caa]',
      hover: 'hover:bg-[#3a0caa]/10',
      border: 'border-[#3a0caa]/20 hover:border-[#3a0caa]/30'
    };
  }

  /**
   * Get admin status information
   */
  static getAdminStatusInfo(): {
    title: string;
    description: string;
  } {
    return {
      title: 'Modo Administrador',
      description: 'Tienes acceso completo a todas las funciones administrativas de la plataforma.'
    };
  }
}
