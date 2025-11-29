// import { supabase } from '@/integrations/supabase/client';
import {
  Notification,
  NotificationFilters,
  NotificationResponse,
  NotificationType,
  NotificationPriority
} from '../types';

const STORAGE_KEY = 'ondai_notifications';

export class NotificationService {
  /**
   * Obtiene todas las notificaciones del usuario desde localStorage
   */
  static async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      const notifications: Notification[] = stored ? JSON.parse(stored) : [];

      return notifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50); // Últimas 50 notificaciones
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Obtiene solo las notificaciones no leídas
   */
  static async fetchUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = await this.fetchNotifications(userId);
      return notifications.filter(n => n.status === 'unread');
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  /**
   * Cuenta las notificaciones no leídas
   */
  static async countUnreadNotifications(userId: string): Promise<number> {
    try {
      const notifications = await this.fetchNotifications(userId);
      return notifications.filter(n => n.status === 'unread').length;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(notificationId: string, userId: string): Promise<NotificationResponse> {
    try {
      const notifications = await this.fetchNotifications(userId);

      // Actualizar estado a 'read' en lugar de eliminar
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, status: 'read' as const } : n
      );

      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));

      return {
        success: true,
        message: 'Notificación marcada como leída'
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
   * Marca todas las notificaciones como leídas
   */
  static async markAllAsRead(userId: string): Promise<NotificationResponse> {
    try {
      const notifications = await this.fetchNotifications(userId);

      const updatedNotifications = notifications.map(n => ({ ...n, status: 'read' as const }));
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));

      return {
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
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
      const notifications = await this.fetchNotifications(userId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedNotifications));

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
   * Crea una nueva notificación en localStorage con deduplicación
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
      const notifications = await this.fetchNotifications(userId);

      // Deduplicación: Verificar si existe una notificación similar reciente (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isDuplicate = notifications.some(n =>
        n.type === type &&
        n.title === title &&
        n.message === message &&
        new Date(n.created_at) > fiveMinutesAgo
      );

      if (isDuplicate) {
        console.log('Duplicate notification prevented:', title);
        return { success: true, message: 'Notificación duplicada ignorada' };
      }

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

      notifications.unshift(notification); // Agregar al inicio

      // Mantener solo las últimas 50
      const trimmedNotifications = notifications.slice(0, 50);

      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(trimmedNotifications));

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
   * Suscribe a cambios en tiempo real (simulado con evento de storage)
   */
  static subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (notificationId: string) => void
  ) {
    // Escuchar cambios en localStorage (para sincronizar pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_${userId}` && e.newValue) {
        const newNotifications: Notification[] = JSON.parse(e.newValue);
        const oldNotifications: Notification[] = e.oldValue ? JSON.parse(e.oldValue) : [];

        // Detectar nueva notificación (simple check: longitud diferente o ID nuevo al principio)
        if (newNotifications.length > oldNotifications.length) {
          onNewNotification(newNotifications[0]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return {
      unsubscribe: () => {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }

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
      const notifications = await this.fetchNotifications(userId);

      const validNotifications = notifications.filter(n => {
        if (!n.expires_at) return true; // Sin expiración
        return new Date(n.expires_at) > now; // No ha expirado
      });

      if (validNotifications.length !== notifications.length) {
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(validNotifications));
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
}

