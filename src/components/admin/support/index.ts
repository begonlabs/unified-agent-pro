// Support Components
export { default as SupportMessages } from './SupportMessages';
export { default as SupportStats } from './SupportStats';
export { TicketSummary } from './components/TicketSummary';
export { TicketFilters } from './components/TicketFilters';
export { TicketTable } from './components/TicketTable';
export { TicketChat } from './components/TicketChat';
export { MessageBubble } from './components/MessageBubble';
export { StatusBadge } from './components/StatusBadge';
export { PriorityBadge } from './components/PriorityBadge';
export { StatsCard } from './components/StatsCard';
export { TicketDistribution } from './components/TicketDistribution';
export { TicketTrends } from './components/TicketTrends';

// Support Hooks
export { useSupportTickets } from './hooks/useSupportTickets';
export { useSupportMessages } from './hooks/useSupportMessages';
export { useSupportStats } from './hooks/useSupportStats';
export { useTicketFilters } from './hooks/useTicketFilters';
export { useChatState } from './hooks/useChatState';

// Support Services
export { SupportService } from './services/supportService';

// Support Types
export type {
  SupportTicket,
  SupportMessage,
  SupportStats as SupportStatsType,
  TicketTrend,
  SupportMessagesProps,
  SupportStatsProps,
  TicketTableProps,
  TicketChatProps,
  TicketFiltersProps,
  TicketSummaryProps,
  MessageBubbleProps,
  StatusBadgeProps,
  PriorityBadgeProps,
  StatsCardProps,
  TicketDistributionProps,
  TicketTrendsProps,
  UseSupportTicketsReturn,
  UseSupportMessagesReturn,
  UseSupportStatsReturn,
  UseTicketFiltersReturn,
  FetchTicketsResponse,
  FetchMessagesResponse,
  SendMessageResponse,
  UpdateTicketResponse,
  FetchSupportStatsResponse,
  TicketStatus,
  TicketPriority,
  MessageType,
  StatusBadgeColorFunction,
  PriorityBadgeColorFunction,
  TicketFilters as TicketFiltersType,
  ChatState
} from './types';
