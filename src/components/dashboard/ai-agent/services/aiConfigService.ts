import { supabase } from '@/integrations/supabase/client';
import { AIConfig, AIConfigFormData, OperatingHours, TrainingProgress } from '../types';

export class AIConfigService {
  /**
   * Obtiene la configuración de IA del usuario actual
   */
  static async getAIConfig(): Promise<AIConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? this.mapToAIConfig(data) : null;
    } catch (error) {
      console.error('Error fetching AI config:', error);
      throw error;
    }
  }

  /**
   * Guarda la configuración de IA
   */
  static async saveAIConfig(config: AIConfigFormData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular progreso de entrenamiento automáticamente
      const training_progress: TrainingProgress = {
        goals: !!config.goals.trim(),
        restrictions: !!config.restrictions.trim(),
        knowledge_base: !!config.knowledge_base.trim(),
        faq: !!config.faq.trim(),
        advisor: config.advisor_enabled && !!config.advisor_message.trim(),
        schedule: config.always_active || (config.operating_hours && Object.keys(config.operating_hours).length > 0)
      };

      const configData = {
        ...config,
        training_progress,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      // Verificar si existe configuración previa
      const { data: existingConfig } = await supabase
        .from('ai_configurations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingConfig) {
        // Actualizar configuración existente
        result = await supabase
          .from('ai_configurations')
          .update(configData)
          .eq('id', existingConfig.id)
          .eq('user_id', user.id);
      } else {
        // Insertar nueva configuración
        result = await supabase
          .from('ai_configurations')
          .insert(configData);
      }

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error saving AI config:', error);
      throw error;
    }
  }

  /**
   * Valida la configuración antes de guardar
   */
  static validateConfig(config: AIConfigFormData): string[] {
    const errors: string[] = [];

    if (!config.goals.trim()) {
      errors.push('Los objetivos son requeridos');
    }

    if (!config.restrictions.trim()) {
      errors.push('Las restricciones son requeridas');
    }

    if (config.response_time < 5 || config.response_time > 300) {
      errors.push('El tiempo de respuesta debe estar entre 5 y 300 segundos');
    }

    return errors;
  }

  /**
   * Mapea los datos de la BD al formato de la interfaz
   */
  private static mapToAIConfig(data: Record<string, unknown>): AIConfig {
    return {
      id: data.id as string,
      goals: (data.goals as string) || '',
      restrictions: (data.restrictions as string) || '',
      common_questions: (data.common_questions as string) || '',
      response_time: (data.response_time as number) || 30,
      knowledge_base: (data.knowledge_base as string) || '',
      faq: (data.faq as string) || '',
      is_active: (data.is_active as boolean) ?? true,
      // Nuevas funcionalidades
      advisor_enabled: (data.advisor_enabled as boolean) ?? false,
      advisor_message: (data.advisor_message as string) || 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.',
      always_active: (data.always_active as boolean) ?? true,
      operating_hours: (data.operating_hours as OperatingHours) || {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: true, start: '09:00', end: '18:00' },
        sunday: { enabled: true, start: '09:00', end: '18:00' }
      },
      training_progress: (data.training_progress as TrainingProgress) || {
        goals: false,
        restrictions: false,
        knowledge_base: false,
        faq: false,
        advisor: false,
        schedule: false
      }
    };
  }

  /**
   * Obtiene el estado de configuración
   */
  static getConfigStatus(config: AIConfigFormData) {
    return {
      goals: !!config.goals.trim(),
      restrictions: !!config.restrictions.trim(),
      knowledge_base: !!config.knowledge_base.trim(),
      advisor: config.advisor_enabled && !!config.advisor_message.trim(),
      schedule: config.always_active || (config.operating_hours && Object.keys(config.operating_hours).length > 0)
    };
  }
}
