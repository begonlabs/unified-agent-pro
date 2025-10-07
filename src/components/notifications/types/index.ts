// Tipos de notificación
export type NotificationType = 
  | 'message'           // Nuevo mensaje
  | 'ticket'            // Ticket de soporte
  | 'channel'           // Cambio en canal
  | 'ai_response'       // Respuesta de IA
  | 'verification'      // Verificación requerida
  | 'connection'        // Estado de conexión
  | 'system'            // Notificación del sistema
  | 'warning'           // Advertencia
  | 'error';            // Error

// Prioridad de la notificación
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Estado de la notificación
export type NotificationStatus = 'unread' | 'read' | 'archived';

// Interfaz principal de notificación
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  action_url?: string;
  action_label?: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

// Metadata adicional según el tipo
export interface NotificationMetadata {
  conversation_id?: string;
  ticket_id?: string;
  channel_id?: string;
  channel_type?: string;
  message_id?: string;
  client_name?: string;
  [key: string]: unknown;
}

// Props para el componente NotificationBell
export interface NotificationBellProps {
  isMobile?: boolean;
}

// Props para el componente NotificationPanel
export interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  onNotificationClick: (notification: Notification) => void;
  loading?: boolean;
}

// Props para el componente NotificationItem
export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  onClick: (notification: Notification) => void;
}

// Filtros de notificaciones
export interface NotificationFilters {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  status?: NotificationStatus[];
  dateFrom?: string;
  dateTo?: string;
}

// Respuesta del servicio
export interface NotificationResponse {
  success: boolean;
  message?: string;
  data?: Notification | Notification[];
  error?: string;
}

// Hook return type
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Partial<Notification>) => Promise<void>;
  filterNotifications: (filters: NotificationFilters) => Notification[];
}

// Configuración de iconos por tipo
export interface NotificationTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

