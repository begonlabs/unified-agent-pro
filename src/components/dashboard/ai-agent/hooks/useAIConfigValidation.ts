import { useMemo } from 'react';
import { AIConfigFormData, AIConfigStatus } from '../types';

export const useAIConfigValidation = (config: AIConfigFormData) => {
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones requeridas
    if (!config.goals.trim()) {
      errors.push('Los objetivos son requeridos');
    }

    if (!config.restrictions.trim()) {
      errors.push('Las restricciones son requeridas');
    }

    // Validaciones de formato
    if (config.response_time < 5 || config.response_time > 300) {
      errors.push('El tiempo de respuesta debe estar entre 5 y 300 segundos');
    }

    // Advertencias
    if (!config.knowledge_base.trim()) {
      warnings.push('Se recomienda agregar información en la base de conocimiento');
    }

    if (!config.faq.trim()) {
      warnings.push('Se recomienda agregar respuestas frecuentes');
    }

    if (!config.common_questions.trim()) {
      warnings.push('Se recomienda agregar preguntas comunes');
    }

    // Estado de configuración
    const status: AIConfigStatus = {
      goals: !!config.goals.trim(),
      restrictions: !!config.restrictions.trim(),
      knowledge_base: !!config.knowledge_base.trim()
    };

    const isComplete = status.goals && status.restrictions;
    const hasWarnings = warnings.length > 0;
    const hasErrors = errors.length > 0;

    return {
      errors,
      warnings,
      status,
      isComplete,
      hasWarnings,
      hasErrors,
      completionPercentage: Math.round(
        (Object.values(status).filter(Boolean).length / Object.keys(status).length) * 100
      )
    };
  }, [config]);

  return validation;
};
