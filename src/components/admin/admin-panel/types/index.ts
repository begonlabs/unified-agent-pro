import { User } from '@supabase/supabase-js';
import { LucideIcon } from 'lucide-react';

// Admin panel tab interface
export interface AdminTab {
  id: string;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

// Admin panel props interface
export interface AdminPanelProps {
  user: User;
}

// Admin panel header props
export interface AdminPanelHeaderProps {
  user: User;
}

// Admin panel navigation props
export interface AdminPanelNavigationProps {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

// Admin panel content props
export interface AdminPanelContentProps {
  tabs: AdminTab[];
  activeTab: string;
  supportView: string;
  onSupportViewChange: (view: string) => void;
}

// Support sub-navigation props
export interface SupportSubNavigationProps {
  supportView: string;
  onSupportViewChange: (view: string) => void;
}

// Hook return types
export interface UseAdminPanelReturn {
  activeTab: string;
  supportView: string;
  setActiveTab: (tab: string) => void;
  setSupportView: (view: string) => void;
  tabs: AdminTab[];
}

// Service response types
export interface TabConfiguration {
  tabs: AdminTab[];
  defaultTab: string;
  supportSubViews: string[];
}
