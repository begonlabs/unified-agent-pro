// General Stats Module - Types

export interface DailyStats {
  date: string;
  messages: number;
  leads: number;
}

// General statistics data interface
export interface GeneralStatsData {
  total_clients: number;
  free_clients: number;
  basico_clients: number;
  avanzado_clients: number;
  pro_clients: number;
  empresarial_clients: number;
  total_messages_platform: number;
  total_leads_platform: number;
  whatsapp_messages: number;
  facebook_messages: number;
  instagram_messages: number;
  whatsapp_leads: number;
  facebook_leads: number;
  instagram_leads: number;
  total_conversations: number;
  active_clients: number;
  inactive_clients: number;
  daily_activity?: DailyStats[];
}

// Plan counts interface
export interface PlanCounts {
  free: number;
  basico: number;
  avanzado: number;
  pro: number;
  empresarial: number;
  active: number;
  inactive: number;
  // Legacy support
  premium: number;
  enterprise: number;
}

// Channel statistics interface
export interface ChannelStats {
  whatsapp: { messages: number; leads: number };
  facebook: { messages: number; leads: number };
  instagram: { messages: number; leads: number };
}

// Component props interfaces
export interface GeneralStatsProps {
  className?: string;
}

export interface ClientStatsSectionProps {
  stats: GeneralStatsData;
}

export interface PlatformActivitySectionProps {
  stats: GeneralStatsData;
}

export interface ChannelActivitySectionProps {
  stats: GeneralStatsData;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  showPercentage?: boolean;
  totalValue?: number;
}

export interface ChannelCardProps {
  channel: 'whatsapp' | 'facebook' | 'instagram';
  messages: number;
  leads: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

// Hook return types
export interface UseGeneralStatsReturn {
  stats: GeneralStatsData | null;
  loading: boolean;
  fetchGeneralStats: () => Promise<void>;
}

// Service response types
export interface FetchGeneralStatsResponse {
  stats: GeneralStatsData;
  success: boolean;
  error?: string;
}

// Utility types
export type PlanType = 'free' | 'basico' | 'avanzado' | 'pro' | 'empresarial' | 'premium' | 'enterprise';
export type ChannelType = 'whatsapp' | 'facebook' | 'instagram';

// Icon color functions
export type IconColorFunction = (plan: PlanType) => string;
export type ChannelIconColorFunction = (channel: ChannelType) => string;
