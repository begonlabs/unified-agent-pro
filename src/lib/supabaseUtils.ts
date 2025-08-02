import { supabase } from '@/integrations/supabase/client';

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

// Función para detectar errores de conexión
export const isConnectionError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('upstream connect error') ||
    errorMessage.includes('503') ||
    errorMessage.includes('502') ||
    errorMessage.includes('504') ||
    errorMessage.includes('Connection refused') ||
    errorMessage.includes('Network Error') ||
    errorMessage.includes('fetch')
  );
};

// Función de reintento con backoff exponencial
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isConnectionError(error)) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, RETRY_CONFIG.maxRetries - retries),
        RETRY_CONFIG.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1);
    }
    throw error;
  }
};

// Wrapper para consultas SELECT con reintentos
export const supabaseSelect = async (query: any) => {
  return retryWithBackoff(async () => {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  });
};

// Wrapper para operaciones INSERT con reintentos
export const supabaseInsert = async (query: any) => {
  return retryWithBackoff(async () => {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  });
};

// Wrapper para operaciones UPDATE con reintentos
export const supabaseUpdate = async (query: any) => {
  return retryWithBackoff(async () => {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  });
};

// Wrapper para operaciones DELETE con reintentos
export const supabaseDelete = async (query: any) => {
  return retryWithBackoff(async () => {
    const result = await query;
    if (result.error) throw result.error;
    return result;
  });
};

// Función para manejo consistente de errores
export const handleSupabaseError = (error: any, defaultMessage: string) => {
  console.error('Supabase error:', error);
  
  if (isConnectionError(error)) {
    return {
      title: "Error de conexión",
      description: "Problemas de conectividad. La aplicación reintentará automáticamente.",
      isConnectionError: true
    };
  }
  
  return {
    title: "Error",
    description: error?.message || defaultMessage,
    isConnectionError: false
  };
};