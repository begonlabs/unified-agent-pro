// Support Module - Types

// Support ticket interface
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  unread_count: number;
  // New enhanced fields
  assigned_to?: string;
  tags?: string[];
  first_response_at?: string;
  resolved_at?: string;
  customer_satisfaction?: number;
  user_profile?: {
    company_name: string;
    email: string;
  };
}

// Support message interface
export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  message_type: 'user' | 'admin' | 'system';
  is_read: boolean;
  created_at: string;
}

// Support statistics interface
export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  satisfactionRate: number;
  ticketsThisWeek: number;
  ticketsThisMonth: number;
}

// Ticket trend interface
export interface TicketTrend {
  date: string;
  open: number;
  closed: number;
}

// Component props interfaces
export interface SupportMessagesProps {
  className?: string;
}

export interface SupportStatsProps {
  className?: string;
}

export interface TicketTableProps {
  tickets: SupportTicket[];
  loading: boolean;
  onTicketSelect: (ticket: SupportTicket) => void;
  onStatusUpdate: (ticketId: string, status: SupportTicket['status']) => void;
  onRefresh: () => void;
  // Enhanced props
  selectedTickets?: Set<string>;
  onToggleSelect?: (ticketId: string) => void;
  onSelectAll?: (ticketIds: string[]) => void;
  sortConfig?: SortConfig | null;
  onSort?: (config: SortConfig) => void;
  onAssignToMe?: (ticketId: string) => void;
  onPriorityUpdate?: (ticketId: string, priority: TicketPriority) => void;
}

export interface TicketChatProps {
  ticket: SupportTicket | null;
  messages: SupportMessage[];
  loading: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onStatusUpdate: (status: SupportTicket['status']) => void;
}

export interface TicketFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  searchTerm: string;
  onStatusFilterChange: (status: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
}

export interface TicketSummaryProps {
  tickets: SupportTicket[];
}

export interface MessageBubbleProps {
  message: SupportMessage;
}

export interface StatusBadgeProps {
  status: SupportTicket['status'];
}

export interface PriorityBadgeProps {
  priority: SupportTicket['priority'];
}

export interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export interface TicketDistributionProps {
  stats: SupportStats;
}

export interface TicketTrendsProps {
  trends: TicketTrend[];
}

// Hook return types
export interface UseSupportTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  fetchTickets: () => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  updateTicketPriority: (ticketId: string, priority: SupportTicket['priority']) => Promise<void>;
  assignTicket: (ticketId: string, adminId: string) => Promise<void>;
}

export interface UseSupportMessagesReturn {
  messages: SupportMessage[];
  loading: boolean;
  fetchMessages: (ticketId: string) => Promise<FetchMessagesResponse>;
  sendMessage: (ticketId: string, message: string, ticket: SupportTicket) => Promise<SendMessageResponse>;
}

export interface UseSupportStatsReturn {
  stats: SupportStats;
  trends: TicketTrend[];
  loading: boolean;
  fetchStats: () => Promise<void>;
}

export interface UseTicketFiltersReturn {
  statusFilter: string;
  priorityFilter: string;
  searchTerm: string;
  filteredTickets: SupportTicket[];
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setSearchTerm: (term: string) => void;
}

// Service response types
export interface FetchTicketsResponse {
  tickets: SupportTicket[];
  success: boolean;
  error?: string;
}

export interface FetchMessagesResponse {
  messages: SupportMessage[];
  success: boolean;
  error?: string;
}

export interface SendMessageResponse {
  message: SupportMessage;
  success: boolean;
  error?: string;
}

export interface UpdateTicketResponse {
  ticket: SupportTicket;
  success: boolean;
  error?: string;
}

export interface FetchSupportStatsResponse {
  stats: SupportStats;
  trends: TicketTrend[];
  success: boolean;
  error?: string;
}

// Utility types
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageType = 'user' | 'admin' | 'system';

// Badge color functions
export type StatusBadgeColorFunction = (status: TicketStatus) => string;
export type PriorityBadgeColorFunction = (priority: TicketPriority) => string;

// Filter types
export interface TicketFilters {
  status: string;
  priority: string;
  search: string;
}

// Chat state interface
export interface ChatState {
  selectedTicket: SupportTicket | null;
  messages: SupportMessage[];
  loadingMessages: boolean;
  response: string;
}

// Internal note interface
export interface InternalNote {
  id: string;
  ticket_id: string;
  admin_id: string;
  note: string;
  created_at: string;
}

// Advanced filter interface
export interface AdvancedFilters {
  status: string[];
  priority: string[];
  assigned: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  search: string;
  tags: string[];
}

// Filter preset interface
export interface FilterPreset {
  id: string;
  label: string;
  icon: string;
  filters: Partial<AdvancedFilters>;
}

// View mode type
export type ViewMode = 'table' | 'kanban' | 'timeline' | 'compact';

// Bulk action type
export type BulkAction = 'status' | 'priority' | 'assign' | 'close' | 'tag';

// Sort configuration
export interface SortConfig {
  field: keyof SupportTicket;
  direction: 'asc' | 'desc';
}
