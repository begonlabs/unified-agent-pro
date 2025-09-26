import { 
  MessageSquare, 
  Users,
  BarChart3, 
  Settings, 
  User, 
  HelpCircle, 
  Bot
} from 'lucide-react';
import { MenuItem } from '../types';

export class SidebarService {
  /**
   * Obtiene los elementos del menú principal
   */
  static getMenuItems(): MenuItem[] {
    return [
      { 
        id: 'ai-agent', 
        label: 'Mi Agente IA', 
        shortLabel: 'Agente IA',
        icon: Bot 
      },
      { 
        id: 'messages', 
        label: 'Mensajes', 
        shortLabel: 'Mensajes',
        icon: MessageSquare 
      },
      { 
        id: 'crm', 
        label: 'CRM Clientes', 
        shortLabel: 'CRM',
        icon: Users 
      },
      { 
        id: 'stats', 
        label: 'Estadísticas', 
        shortLabel: 'Stats',
        icon: BarChart3 
      },
      { 
        id: 'channels', 
        label: 'Canales', 
        shortLabel: 'Canales',
        icon: Settings 
      },
      { 
        id: 'profile', 
        label: 'Perfil', 
        shortLabel: 'Perfil',
        icon: User 
      },
      { 
        id: 'support', 
        label: 'Soporte', 
        shortLabel: 'Soporte',
        icon: HelpCircle 
      },
    ];
  }

  /**
   * Obtiene la configuración por defecto del sidebar
   */
  static getDefaultConfig() {
    return {
      variant: 'responsive' as const,
      showChannelStatus: true,
      showAdminSection: true,
      showSignOut: true
    };
  }

  /**
   * Valida si una vista es válida
   */
  static isValidView(view: string): boolean {
    const validViews = this.getMenuItems().map(item => item.id);
    return validViews.includes(view);
  }

  /**
   * Obtiene el label corto para una vista específica
   */
  static getShortLabel(viewId: string): string {
    const item = this.getMenuItems().find(item => item.id === viewId);
    return item?.shortLabel || item?.label || viewId;
  }

  /**
   * Obtiene el label completo para una vista específica
   */
  static getFullLabel(viewId: string): string {
    const item = this.getMenuItems().find(item => item.id === viewId);
    return item?.label || viewId;
  }
}
