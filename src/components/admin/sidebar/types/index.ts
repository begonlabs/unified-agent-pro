import { LucideIcon } from 'lucide-react';

// Admin sidebar menu item interface
export interface AdminMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
}

// Admin sidebar props interface
export interface AdminSidebarProps {
  onSignOut: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Admin sidebar navigation props
export interface AdminSidebarNavigationProps {
  menuItems: AdminMenuItem[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Admin sidebar actions props
export interface AdminSidebarActionsProps {
  onSignOut: () => void;
  onBackToDashboard?: () => void;
}

// Hook return types
export interface UseAdminSidebarReturn {
  menuItems: AdminMenuItem[];
  handleMenuClick: (itemId: string) => void;
  handleBackToDashboard: () => void;
}
