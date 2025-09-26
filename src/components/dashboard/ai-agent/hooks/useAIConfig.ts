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
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig({
      goals: '',
      restrictions: '',
      common_questions: '',
      response_time: 30,
      knowledge_base: '',
      faq: '',
      is_active: true
    });
  };

  useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  return {
    config,
    loading,
    saving,
    fetchAIConfig,
    saveAIConfig,
    updateConfig,
    resetConfig
  };
};
