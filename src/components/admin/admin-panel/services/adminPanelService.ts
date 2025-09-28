import React from 'react';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare, 
  TrendingUp
} from 'lucide-react';
import { AdminTab, TabConfiguration } from '../types';

// Import components dynamically to avoid circular dependencies
const ClientManagement = React.lazy(() => import('../../ClientManagement'));
const GeneralStats = React.lazy(() => import('../../GeneralStats'));
const ClientStats = React.lazy(() => import('../../ClientStats'));
const AdminSettings = React.lazy(() => import('../../settings/AdminSettings'));
const SupportMessages = React.lazy(() => import('../../SupportMessages'));
const SupportStats = React.lazy(() => import('../../SupportStats'));

export class AdminPanelService {
  /**
   * Get the default tab configuration
   */
  static getTabConfiguration(): TabConfiguration {
    const tabs: AdminTab[] = [
      {
        id: 'clients',
        title: 'Gestión de Clientes',
        shortTitle: 'Clientes',
        icon: Users,
        component: ClientManagement
      },
      {
        id: 'general-stats',
        title: 'Estadísticas Generales',
        shortTitle: 'Stats',
        icon: BarChart3,
        component: GeneralStats
      },
      {
        id: 'client-stats',
        title: 'Estadísticas por Cliente',
        shortTitle: 'Por Cliente',
        icon: UserCheck,
        component: ClientStats
      },
      {
        id: 'support',
        title: 'Gestión de Soporte',
        shortTitle: 'Soporte',
        icon: MessageSquare,
        component: SupportMessages // Default support component
      },
      {
        id: 'settings',
        title: 'Configuración',
        shortTitle: 'Config',
        icon: Settings,
        component: AdminSettings
      }
    ];

    return {
      tabs,
      defaultTab: 'clients',
      supportSubViews: ['messages', 'stats']
    };
  }

  /**
   * Get CSS classes for active tab trigger
   */
  static getActiveTabClasses(): string {
    return 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa]';
  }

  /**
   * Get CSS classes for mobile tab trigger
   */
  static getMobileTabClasses(): string {
    return 'flex items-center gap-2 whitespace-nowrap';
  }

  /**
   * Get CSS classes for desktop tab trigger
   */
  static getDesktopTabClasses(): string {
    return 'flex items-center gap-2';
  }

  /**
   * Get CSS classes for support sub-navigation button
   */
  static getSupportButtonClasses(isActive: boolean): string {
    const baseClasses = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors';
    const activeClasses = 'bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border border-[#3a0caa]/20';
    const inactiveClasses = 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';
    
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  }

  /**
   * Get support sub-navigation configuration
   */
  static getSupportSubNavigation() {
    return [
      {
        id: 'messages',
        title: 'Mensajes',
        icon: MessageSquare,
        component: SupportMessages
      },
      {
        id: 'stats',
        title: 'Estadísticas',
        icon: TrendingUp,
        component: SupportStats
      }
    ];
  }

  /**
   * Get header configuration
   */
  static getHeaderConfig() {
    return {
      title: 'Panel de Administración',
      subtitle: 'Gestión general de la plataforma ChatBot AI',
      logoAlt: 'OndAI Logo'
    };
  }

  /**
   * Get responsive breakpoints
   */
  static getBreakpoints() {
    return {
      mobile: 'sm:hidden',
      desktop: 'hidden sm:grid'
    };
  }
}
