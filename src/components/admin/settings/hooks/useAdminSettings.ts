import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AdminSettingsService } from '../services/adminSettingsService';
import { 
  AdminSettingsData, 
  NotificationSettings, 
  EmailSettings, 
  SecuritySettings, 
  MaintenanceSettings,
  UseAdminSettingsReturn 
} from '../types';

export const useAdminSettings = (): UseAdminSettingsReturn => {
  const [settings, setSettings] = useState<AdminSettingsData>(AdminSettingsService.getDefaultSettings());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await AdminSettingsService.loadSettings();
      setSettings(response.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = (notifications: NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      notifications
    }));
  };

  const updateEmailSettings = (email: EmailSettings) => {
    setSettings(prev => ({
      ...prev,
      email
    }));
  };

  const updateSecuritySettings = (security: SecuritySettings) => {
    setSettings(prev => ({
      ...prev,
      security
    }));
  };

  const updateMaintenanceSettings = (maintenance: MaintenanceSettings) => {
    setSettings(prev => ({
      ...prev,
      maintenance
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      // Validate settings before saving
      const validation = AdminSettingsService.validateAllSettings(settings);
      if (!validation.isValid) {
        toast({
          title: "Error de validación",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      const response = await AdminSettingsService.saveSettings(settings);
      
      if (response.success) {
        toast({
          title: "Configuración guardada",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    setSettings,
    updateNotificationSettings,
    updateEmailSettings,
    updateSecuritySettings,
    updateMaintenanceSettings,
    saveSettings,
    loading
  };
};
