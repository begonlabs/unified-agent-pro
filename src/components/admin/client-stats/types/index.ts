// Client Stats Module - Types

// Client with statistics interface
export interface ClientWithStats {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  plan_type: string;
  is_active: boolean;
  stats: ClientStats;
}

// Client statistics interface
export interface ClientStats {
  whatsapp_messages: number;
  facebook_messages: number;
  instagram_messages: number;
  whatsapp_leads: number;
  facebook_leads: number;
  instagram_leads: number;
  total_messages: number;
  total_leads: number;
  total_conversations: number;
  response_rate: number;
}

// Channel statistics interface
export interface ChannelStats {
  whatsapp: { messages: number; leads: number };
  facebook: { messages: number; leads: number };
  instagram: { messages: number; leads: number };
}

// Component props interfaces
export interface ClientStatsProps {
  className?: string;
}

export interface ClientStatsTableProps {
  clients: ClientWithStats[];
  loading: boolean;
  onViewDetails: (client: ClientWithStats) => void;
}

export interface ClientDetailsModalProps {
  isOpen: boolean;
  client: ClientWithStats | null;
  onClose: () => void;
}

export interface ChannelStatsCardProps {
  channel: 'whatsapp' | 'facebook' | 'instagram';
  stats: { messages: number; leads: number };
}

export interface ActivitySummaryProps {
  stats: ClientStats;
}

// Hook return types
export interface UseClientStatsReturn {
  clients: ClientWithStats[];
  loading: boolean;
  fetchClientStats: () => Promise<void>;
}

export interface UseClientDetailsReturn {
  selectedClient: ClientWithStats | null;
  isModalOpen: boolean;
  openClientDetails: (client: ClientWithStats) => void;
  closeClientDetails: () => void;
}

// Service response types
export interface FetchClientStatsResponse {
  clients: ClientWithStats[];
  success: boolean;
  error?: string;
}

// Utility types
export type ChannelType = 'whatsapp' | 'facebook' | 'instagram';
export type PlanType = 'free' | 'basico' | 'avanzado' | 'pro' | 'empresarial' | 'premium' | 'enterprise';

// Badge color functions
export type BadgeColorFunction = (value: string) => string;
export type ChannelIconFunction = (channel: string) => React.ReactElement;
