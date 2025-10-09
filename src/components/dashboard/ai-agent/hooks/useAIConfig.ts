import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { AIConfigService } from '../services/aiConfigService';
import { AIConfig, AIConfigFormData } from '../types';
import { NotificationService } from '@/components/notifications';
import { EmailService } from '@/services/emailService';
import { useAuth } from '@/hooks/useAuth';

export const useAIConfig = () => {
  const [config, setConfig] = useState<AIConfig>({
    goals: '',
    restrictions: '',
    common_questions: '',
    response_time: 30,
    knowledge_base: '',
    faq: '',
    is_active: true,
    // Nuevas funcionalidades
    advisor_enabled: false,
    advisor_message: 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.',
    always_active: true,
    operating_hours: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: true, start: '09:00', end: '18:00' },
      sunday: { enabled: true, start: '09:00', end: '18:00' }
    },
    training_progress: {
      goals: false,
      restrictions: false,
      knowledge_base: false,
      faq: false,
      advisor: false,
      schedule: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      await fetchAIConfig();
    },
    'ai-agent'
  );

  const fetchAIConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AIConfigService.getAIConfig();
      if (data) {
        setConfig(data);
      }
    } catch (error: unknown) {
      const isConnectionError = (error as Error)?.message?.includes('upstream connect error') || 
                               (error as Error)?.message?.includes('503');
      
      if (isConnectionError) {
        // Crear notificación de error de conexión
        if (user?.id) {
          NotificationService.createNotification(
            user.id,
            'error',
            'Error de Conexión IA',
            'Problemas de conectividad al cargar la configuración del agente IA',
            {
              priority: 'high',
              metadata: {
                module: 'ai_agent',
                action: 'connection_error',
                error_type: 'upstream_error',
                error_message: error instanceof Error ? error.message : 'Error desconocido'
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Reintentar'
            }
          ).catch(notificationError => {
            console.error('Error creating connection notification:', notificationError);
          });
        }
        
        toast({
          title: "Error de conexión",
          description: "Problemas de conectividad. Reintentando automáticamente...",
          variant: "destructive",
        });
        
        setTimeout(() => {
          fetchAIConfig();
        }, 3000);
      } else {
        // Crear notificación de error general
        if (user?.id) {
          NotificationService.createNotification(
            user.id,
            'error',
            'Error Cargando IA',
            'No se pudo cargar la configuración del agente IA',
            {
              priority: 'high',
              metadata: {
                module: 'ai_agent',
                action: 'load_error',
                error_type: 'general_error',
                error_message: error instanceof Error ? error.message : 'Error desconocido'
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Reintentar'
            }
          ).catch(notificationError => {
            console.error('Error creating load notification:', notificationError);
          });
        }
        
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveAIConfig = async () => {
    setSaving(true);
    try {
      // Validar configuración
      const errors = AIConfigService.validateConfig(config);
      if (errors.length > 0) {
        // Crear notificación de error de validación
        if (user?.id) {
          NotificationService.createNotification(
            user.id,
            'error',
            'Configuración incompleta',
            `Faltan campos requeridos: ${errors.join(', ')}`,
            {
              priority: 'high',
              metadata: {
                error_type: 'validation_failed',
                missing_fields: errors,
                module: 'ai_agent'
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Completar configuración'
            }
          ).catch(error => {
            console.error('Error creating validation notification:', error);
          });
        }
        
        toast({
          title: "Configuración incompleta",
          description: errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      await AIConfigService.saveAIConfig(config);
      
      // Crear notificación de éxito
      if (user?.id) {
        const completionPercentage = Math.round(
          (Object.values(config.training_progress).filter(Boolean).length / Object.keys(config.training_progress).length) * 100
        );
        
        NotificationService.createNotification(
          user.id,
          'system',
          'Agente IA actualizado',
          `Configuración guardada exitosamente. Progreso: ${completionPercentage}%`,
          {
            priority: 'medium',
            metadata: {
              completion_percentage: completionPercentage,
              is_active: config.is_active,
              module: 'ai_agent',
              action: 'config_saved'
            },
            action_url: '/dashboard/ai-agent',
            action_label: 'Ver configuración'
          }
        ).catch(error => {
          console.error('Error creating success notification:', error);
        });
      }
      
      toast({
        title: "Configuración guardada",
        description: "Tu agente de IA ha sido actualizado exitosamente",
      });
    } catch (error: unknown) {
      // Crear notificación de error crítico
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'error',
          'Error crítico en IA',
          'No se pudo guardar la configuración del agente IA',
          {
            priority: 'high',
            metadata: {
              error_type: 'save_failed',
              module: 'ai_agent',
              error_message: error instanceof Error ? error.message : 'Error desconocido'
            },
            action_url: '/dashboard/ai-agent',
            action_label: 'Reintentar'
          }
        ).catch(notificationError => {
          console.error('Error creating error notification:', notificationError);
        });

        // Enviar correo de error crítico
        EmailService.shouldSendEmail(user.id, 'system').then(shouldSend => {
          if (shouldSend && user.email) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            const template = EmailService.getTemplates().criticalError(
              user.email.split('@')[0], 
              `Error al guardar configuración: ${errorMessage}`
            );
            EmailService.sendEmail({
              to: user.email,
              template,
              priority: 'high'
            }).catch(emailError => {
              console.error('Error sending critical error email:', emailError);
            });
          }
        });
      }
      
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Detectar cambios importantes y crear notificaciones
      if (user?.id) {
        // Notificación de activación/desactivación del agente
        if ('is_active' in updates && updates.is_active !== prev.is_active) {
          NotificationService.createNotification(
            user.id,
            'system',
            updates.is_active ? 'Agente IA Activado' : 'Agente IA Desactivado',
            updates.is_active 
              ? 'Tu agente IA ahora responderá automáticamente a los mensajes'
              : 'Tu agente IA ha sido desactivado y no responderá automáticamente',
            {
              priority: 'high',
              metadata: {
                module: 'ai_agent',
                action: 'agent_toggle',
                is_active: updates.is_active,
                previous_state: prev.is_active
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Ver configuración'
            }
          ).catch(error => {
            console.error('Error creating agent toggle notification:', error);
          });

          // Enviar correo de activación/desactivación
          if (updates.is_active) {
            EmailService.shouldSendEmail(user.id, 'aiAgent').then(shouldSend => {
              if (shouldSend && user.email) {
                const template = EmailService.getTemplates().aiAgentActivated(user.email.split('@')[0]);
                EmailService.sendEmail({
                  to: user.email,
                  template,
                  priority: 'high'
                }).catch(error => {
                  console.error('Error sending activation email:', error);
                });
              }
            });
          }
        }
        
        // Notificación de cambio en horarios
        if ('always_active' in updates && updates.always_active !== prev.always_active) {
          NotificationService.createNotification(
            user.id,
            'system',
            updates.always_active ? 'Horarios: Siempre Activo' : 'Horarios: Configuración Específica',
            updates.always_active
              ? 'El agente ahora funcionará las 24 horas'
              : 'El agente ahora funcionará según horarios específicos',
            {
              priority: 'medium',
              metadata: {
                module: 'ai_agent',
                action: 'schedule_change',
                always_active: updates.always_active
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Ver horarios'
            }
          ).catch(error => {
            console.error('Error creating schedule notification:', error);
          });
        }
        
        // Notificación de activación del asesor humano
        if ('advisor_enabled' in updates && updates.advisor_enabled !== prev.advisor_enabled) {
          NotificationService.createNotification(
            user.id,
            'system',
            updates.advisor_enabled ? 'Asesor Humano Activado' : 'Asesor Humano Desactivado',
            updates.advisor_enabled
              ? 'El agente ahora derivará consultas complejas a humanos'
              : 'El agente ya no derivará consultas a humanos',
            {
              priority: 'medium',
              metadata: {
                module: 'ai_agent',
                action: 'advisor_toggle',
                advisor_enabled: updates.advisor_enabled
              },
              action_url: '/dashboard/ai-agent',
              action_label: 'Ver configuración'
            }
          ).catch(error => {
            console.error('Error creating advisor notification:', error);
          });
        }
      }
      
      // Auto-save cuando se actualiza la configuración
      // Usar debounce implícito con setTimeout
      if (typeof window !== 'undefined') {
        const globalWindow = window as Window & { __aiConfigSaveTimeout?: NodeJS.Timeout };
        const timeoutId = globalWindow.__aiConfigSaveTimeout;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        globalWindow.__aiConfigSaveTimeout = setTimeout(() => {
          autoSaveConfig(newConfig);
        }, 1500); // Guardar después de 1.5 segundos de inactividad
      }
      
      return newConfig;
    });
  };

  const autoSaveConfig = async (configToSave: AIConfig) => {
    setAutoSaving(true);
    try {
      // Validar configuración básica antes de guardar
      const errors = AIConfigService.validateConfig(configToSave);
      if (errors.length > 0) {
        // No mostrar errores en auto-save, solo en save manual
        setAutoSaving(false);
        return;
      }

      await AIConfigService.saveAIConfig(configToSave);
      
      // NO hacer re-fetch completo para evitar interrumpir al usuario
      // Solo actualizar el estado local con el training_progress calculado
      setConfig(prev => ({
        ...prev,
        training_progress: {
          goals: !!configToSave.goals.trim(),
          restrictions: !!configToSave.restrictions.trim(),
          knowledge_base: !!configToSave.knowledge_base.trim(),
          faq: !!configToSave.faq.trim(),
          advisor: configToSave.advisor_enabled && !!configToSave.advisor_message.trim(),
          schedule: configToSave.always_active || (configToSave.operating_hours && Object.keys(configToSave.operating_hours).length > 0)
        }
      }));
      
      // Mostrar notificación sutil y no intrusiva
      toast({
        title: "✓ Guardado",
        description: "Cambios guardados automáticamente",
        duration: 1500,
      });
    } catch (error) {
      // Silenciar errores de auto-save, el usuario puede guardar manualmente
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig({
      goals: '',
      restrictions: '',
      common_questions: '',
      response_time: 30,
      knowledge_base: '',
      faq: '',
      is_active: true,
      // Nuevas funcionalidades
      advisor_enabled: false,
      advisor_message: 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.',
      always_active: true,
      operating_hours: {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: true, start: '09:00', end: '18:00' },
        sunday: { enabled: true, start: '09:00', end: '18:00' }
      },
      training_progress: {
        goals: false,
        restrictions: false,
        knowledge_base: false,
        faq: false,
        advisor: false,
        schedule: false
      }
    });
  };

  useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  return {
    config,
    loading,
    saving,
    autoSaving,
    fetchAIConfig,
    saveAIConfig,
    updateConfig,
    resetConfig
  };
};
