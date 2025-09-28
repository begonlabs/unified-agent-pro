import { User } from '@supabase/supabase-js';

// Support ticket interface
export interface SupportTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  unread_count: number;
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

// Form data interface for creating tickets
export interface SupportFormData {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Priority levels
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

// Status levels
export type StatusLevel = 'open' | 'in_progress' | 'waiting_response' | 'closed';

// Message types
export type MessageType = 'user' | 'admin' | 'system';

// SupportView component props
export interface SupportViewProps {
  user?: User | null;
}

// Ticket list component props
export interface TicketListProps {
  tickets: SupportTicket[];
  loading: boolean;
  onTicketSelect: (ticket: SupportTicket) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}

// Ticket form component props
export interface TicketFormProps {
  formData: SupportFormData;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (formData: SupportFormData) => void;
}

// Chat view component props
export interface ChatViewProps {
  ticket: SupportTicket;
  messages: SupportMessage[];
  newMessage: string;
  loadingMessages: boolean;
  sendingMessage: boolean;
  onBack: () => void;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}

// Message bubble component props
export interface MessageBubbleProps {
  message: SupportMessage;
  formatDate: (dateString: string) => string;
}

// Ticket card component props
export interface TicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (dateString: string) => string;
}

// Service response interfaces
export interface CreateTicketResponse {
  ticket: SupportTicket;
  message: SupportMessage;
}

export interface SendMessageResponse {
  message: SupportMessage;
}

// Hook return types
export interface UseSupportTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  fetchTickets: () => Promise<void>;
}

export interface UseSupportMessagesReturn {
  messages: SupportMessage[];
  loading: boolean;
  fetchMessages: (ticketId: string) => Promise<void>;
}

export interface UseSupportFormReturn {
  formData: SupportFormData;
  loading: boolean;
  setFormData: (formData: SupportFormData) => void;
  resetForm: () => void;
  submitTicket: () => Promise<void>;
}

export interface UseSupportChatReturn {
  newMessage: string;
  sendingMessage: boolean;
  setNewMessage: (message: string) => void;
  sendMessage: (ticketId: string) => Promise<void>;
}

// Utility function types
export type PriorityColorFunction = (priority: string) => string;
export type StatusColorFunction = (status: string) => string;
export type DateFormatterFunction = (dateString: string) => string;

export type { User };
