import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { AIConfigService } from '../services/aiConfigService';
import { AIConfig, AIConfigFormData } from '../types';

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
        toast({
          title: "Error de conexión",
          description: "Problemas de conectividad. Reintentando automáticamente...",
          variant: "destructive",
        });
        
        setTimeout(() => {
          fetchAIConfig();
        }, 3000);
      } else {
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
        toast({
          title: "Configuración incompleta",
          description: errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      await AIConfigService.saveAIConfig(config);
      
      toast({
        title: "Configuración guardada",
        description: "Tu agente de IA ha sido actualizado exitosamente",
      });
    } catch (error: unknown) {
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
