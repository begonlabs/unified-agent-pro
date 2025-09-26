import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NotificationSettings } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    new_messages: true,
    plan_limits: true,
    product_updates: false,
    email_notifications: true
  });
  const { toast } = useToast();

  const updateNotificationSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // Aquí podrías agregar lógica para guardar en la base de datos
    toast({
      title: "Configuración actualizada",
      description: `Notificaciones ${value ? 'activadas' : 'desactivadas'} para ${key.replace('_', ' ')}`,
    });
  }, [toast]);

  return {
    notifications,
    setNotifications,
    updateNotificationSetting
  };
};
