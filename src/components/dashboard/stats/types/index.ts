import { User } from '@supabase/supabase-js';

// Channel statistics interface
export interface ChannelStat {
  name: string;
  messages: number;
  leads: number;
  color: string;
}

// Daily statistics interface
export interface DailyStat {
  date: Date;
  messages: number;
  leads: number;
  responseRate: number;
}

// Formatted daily statistics for charts
export interface FormattedDailyStat {
  date: string;
  messages: number;
  leads: number;
  responseRate: number;
}

// Main statistics interface
export interface StatsData {
  totalMessages: number;
  automatedMessages: number;
  humanMessages: number;
  clientMessages: number;
  responseRate: number;
  newLeads: number;
  totalClients: number;
  totalConversations: number;
}

// Automation data for pie chart
export interface AutomationData {
  name: string;
  value: number;
  color: string;
}

// StatCard component props
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}

// StatsView component props
export interface StatsViewProps {
  user?: User | null;
}

// Time range options
export type TimeRange = '24h' | '7d' | '30d' | '90d';

// Raw conversation data from database
export interface ConversationData {
  id: string;
  channel: string;
  created_at: string;
  client_id: string | null;
  messages: MessageData[];
}

// Raw message data from database
export interface MessageData {
  id: string;
  sender_type: string;
  is_automated: boolean;
  created_at: string;
}

// Raw client data from database
export interface ClientData {
  id: string;
  status: string;
  created_at: string;
}

// Chart data interfaces
export interface ChartData {
  channelData: ChannelStat[];
  dailyData: FormattedDailyStat[];
  automationData: AutomationData[];
}

// Service response interface
export interface StatsServiceResponse {
  stats: StatsData;
  chartData: ChartData;
}

export type { User };
