export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
}

export interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSignOut: () => void;
  user: UserType | null;
}

export interface ChannelStatus {
  whatsapp: boolean;
  facebook: boolean;
  instagram: boolean;
}

export interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
  isMenuActive: boolean;
}

export type SidebarVariant = 'desktop' | 'mobile' | 'responsive';

export interface SidebarConfig {
  variant: SidebarVariant;
  showChannelStatus: boolean;
  showAdminSection: boolean;
  showSignOut: boolean;
}

// Re-export User type from Supabase
import { User as UserType } from '@supabase/supabase-js';
export type { UserType };
