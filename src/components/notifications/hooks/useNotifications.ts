import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '../services/notificationService';
import { 
  Notification, 
  NotificationFilters,
  UseNotificationsReturn 
} from '../types';

export const useNotifications = (userId: string | undefined): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await NotificationService.fetchNotifications(userId);
      setNotifications(data);
      
      // Contar no leídas
      const unread = data.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);

      // Limpiar notificaciones expiradas
      await NotificationService.cleanupExpiredNotifications(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar notificaciones';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const result = await NotificationService.markAsRead(notificationId, userId);
      
      if (result.success) {
        // Actualizar estado local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
              : n
          )
        );
        
        // Actualizar contador
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(result.error || 'Error al marcar como leída');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result.success) {
        // Actualizar estado local
        const now = new Date().toISOString();
        setNotifications(prev => 
          prev.map(n => ({ ...n, status: 'read' as const, read_at: now }))
        );
        
        // Resetear contador
        setUnreadCount(0);
        
        toast({
          title: "Notificaciones leídas",
          description: "Todas las notificaciones se marcaron como leídas",
        });
      } else {
        throw new Error(result.error || 'Error al marcar todas como leídas');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const result = await NotificationService.deleteNotification(notificationId, userId);
      
      if (result.success) {
        // Obtener la notificación antes de eliminarla para actualizar el contador
        const notification = notifications.find(n => n.id === notificationId);
        
        // Actualizar estado local
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Actualizar contador si era no leída
        if (notification?.status === 'unread') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        throw new Error(result.error || 'Error al eliminar notificación');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      });
    }
  }, [userId, notifications, toast]);

  // Crear notificación
  const createNotification = useCallback(async (notification: Partial<Notification>) => {
    if (!userId) return;

    try {
      const result = await NotificationService.createNotification(
        userId,
        notification.type!,
        notification.title!,
        notification.message!,
        {
          priority: notification.priority,
          metadata: notification.metadata,
          action_url: notification.action_url,
          action_label: notification.action_label,
          expires_at: notification.expires_at
        }
      );

      if (result.success && result.data) {
        const newNotification = result.data as Notification;
        
        // Agregar al inicio de la lista
        setNotifications(prev => [newNotification, ...prev]);
        
        // Incrementar contador si es no leída
        if (newNotification.status === 'unread') {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        throw new Error(result.error || 'Error al crear notificación');
      }
    } catch (err) {
      console.error('Error creating notification:', err);
      toast({
        title: "Error",
        description: "No se pudo crear la notificación",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  // Filtrar notificaciones
  const filterNotifications = useCallback((filters: NotificationFilters): Notification[] => {
    return NotificationService.filterNotifications(notifications, filters);
  }, [notifications]);

  // Cargar notificaciones al montar
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Suscribirse a cambios en tiempo real (simulado)
  useEffect(() => {
    if (!userId) return;

    const subscription = NotificationService.subscribeToNotifications(
      userId,
      // Nueva notificación
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        if (newNotification.status === 'unread') {
          setUnreadCount(prev => prev + 1);
        }
        
        // Mostrar toast para notificaciones urgentes
        if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          });
        }
      },
      // Notificación actualizada
      (updatedNotification) => {
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
        
        // Recalcular contador
        setNotifications(current => {
          const unread = current.filter(n => n.status === 'unread').length;
          setUnreadCount(unread);
          return current;
        });
      },
      // Notificación eliminada
      (deletedId) => {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === deletedId);
          const newNotifications = prev.filter(n => n.id !== deletedId);
          
          // Actualizar contador si era no leída
          if (notification?.status === 'unread') {
            setUnreadCount(current => Math.max(0, current - 1));
          }
          
          return newNotifications;
        });
      }
    );

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [userId, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    filterNotifications
  };
};

