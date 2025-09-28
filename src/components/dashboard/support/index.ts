// Main component
export { default as SupportView } from './SupportView';

// Types
export type {
  SupportTicket,
  SupportMessage,
  SupportFormData,
  PriorityLevel,
  StatusLevel,
  MessageType,
  SupportViewProps,
  TicketListProps,
  TicketFormProps,
  ChatViewProps,
  MessageBubbleProps,
  TicketCardProps,
  CreateTicketResponse,
  SendMessageResponse,
  UseSupportTicketsReturn,
  UseSupportMessagesReturn,
  UseSupportFormReturn,
  UseSupportChatReturn,
  PriorityColorFunction,
  StatusColorFunction,
  DateFormatterFunction,
  User
} from './types';

// Hooks
export {
  useSupportTickets,
  useSupportMessages,
  useSupportForm,
  useSupportChat
} from './hooks';

// Services
export { SupportService } from './services/supportService';

// Components
export {
  MessageBubble,
  TicketCard,
  TicketForm,
  TicketList,
  ChatView,
  SupportHeader
} from './components';
