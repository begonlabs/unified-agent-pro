// import { supabase } from '@/integrations/supabase/client';
import { 
  Notification, 
  NotificationFilters, 
  NotificationResponse,
  NotificationType,
  NotificationPriority 
} from '../types';

// Storage local para notificaciones (en memoria)
const notificationsStore: Map<string, Notification[]> = new Map();

export class NotificationService {
  /**
   * Obtiene todas las notificaciones del usuario desde el storage local
   */
  static async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = notificationsStore.get(userId) || [];
      return notifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50); // Últimas 50 notificaciones
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Obtiene solo las notificaciones no leídas
   */
  static async fetchUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = notificationsStore.get(userId) || [];
      return notifications
        .filter(n => n.status === 'unread')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  /**
   * Cuenta las notificaciones no leídas
   */
  static async countUnreadNotifications(userId: string): Promise<number> {
    try {
      const notifications = notificationsStore.get(userId) || [];
      return notifications.filter(n => n.status === 'unread').length;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Marca una notificación como leída y la elimina automáticamente
   */
  static async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    try {
      const notifications = notificationsStore.get(userId) || [];
      
      // Eliminar la notificación cuando se marca como leída
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      notificationsStore.set(userId, updatedNotifications);

      return {
        success: true,
        message: 'Notificación marcada como leída y eliminada'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Marca todas las notificaciones como leídas y las elimina
   */
  static async markAllAsRead(userId: string): Promise<NotificationResponse> {
    try {
      // Eliminar todas las notificaciones
      notificationsStore.set(userId, []);

      return {
        success: true,
        message: 'Todas las notificaciones marcadas como leídas y eliminadas'
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Elimina una notificación
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<NotificationResponse> {
    try {
      const notifications = notificationsStore.get(userId) || [];
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      notificationsStore.set(userId, updatedNotifications);

      return {
        success: true,
        message: 'Notificación eliminada'
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crea una nueva notificación en el storage local
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      metadata?: Record<string, unknown>;
      action_url?: string;
      action_label?: string;
      expires_at?: string;
    }
  ): Promise<NotificationResponse> {
    try {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        type,
        title,
        message,
        priority: options?.priority || 'medium',
        status: 'unread',
        metadata: options?.metadata || {},
        action_url: options?.action_url,
        action_label: options?.action_label,
        expires_at: options?.expires_at,
        created_at: new Date().toISOString()
      };

      const notifications = notificationsStore.get(userId) || [];
      notifications.unshift(notification); // Agregar al inicio
      notificationsStore.set(userId, notifications);

      return {
        success: true,
        message: 'Notificación creada',
        data: notification
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Filtra notificaciones según criterios
   */
  static filterNotifications(
    notifications: Notification[],
    filters: NotificationFilters
  ): Notification[] {
    let filtered = [...notifications];

    // Filtrar por tipo
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(n => filters.type!.includes(n.type));
    }

    // Filtrar por prioridad
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(n => filters.priority!.includes(n.priority));
    }

    // Filtrar por estado
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(n => filters.status!.includes(n.status));
    }

    // Filtrar por fecha
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(n => new Date(n.created_at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(n => new Date(n.created_at) <= toDate);
    }

    return filtered;
  }

  /**
   * Suscribe a cambios en tiempo real (simulado con localStorage)
   * Para notificaciones en memoria, retorna un objeto mock
   */
  static subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (notificationId: string) => void
  ) {
    // Mock de subscripción para mantener compatibilidad con el hook
    // En el futuro se puede implementar con WebSockets o Server-Sent Events
    console.log('Notification subscription initialized (in-memory mode)');
    
    return {
      unsubscribe: () => {
        console.log('Notification subscription closed');
      }
    };
  }

  /* ============================================
   * FUNCIONES DE SUPABASE (COMENTADAS)
   * ============================================
   * Descomentar cuando se necesite persistencia en Supabase
   * 
  static subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (notificationId: string) => void
  ) {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          onNewNotification(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          onUpdate(payload.new as Notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          onDelete(payload.old.id as string);
        }
      )
      .subscribe();

    return channel;
  }
  */

  /**
   * Formatea la fecha de la notificación
   */
  static formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  }

  /**
   * Limpia notificaciones expiradas del storage local
   */
  static async cleanupExpiredNotifications(userId: string): Promise<void> {
    try {
      const now = new Date();
      const notifications = notificationsStore.get(userId) || [];
      
      const validNotifications = notifications.filter(n => {
        if (!n.expires_at) return true; // Sin expiración
        return new Date(n.expires_at) > now; // No ha expirado
      });
      
      notificationsStore.set(userId, validNotifications);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  /* ============================================
   * FUNCIONES DE SUPABASE (COMENTADAS)
   * ============================================
   * 
  static async cleanupExpiredNotifications(userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', now)
        .not('expires_at', 'is', null);

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
  */
}

