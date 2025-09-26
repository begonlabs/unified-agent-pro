import { supabase } from '@/integrations/supabase/client';
import { AIConfig, AIConfigFormData } from '../types';

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

      const configData = {
        ...config,
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
      is_active: (data.is_active as boolean) ?? true
    };
  }

  /**
   * Obtiene el estado de configuración
   */
  static getConfigStatus(config: AIConfigFormData) {
    return {
      goals: !!config.goals.trim(),
      restrictions: !!config.restrictions.trim(),
      knowledge_base: !!config.knowledge_base.trim()
    };
  }
}
