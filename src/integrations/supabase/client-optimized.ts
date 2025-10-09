import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton pattern para el cliente de Supabase
 * Evita múltiples instancias que causan warnings y comportamientos impredecibles
 */
class SupabaseSingleton {
  private static instance: SupabaseClient | null = null;
  private static isInitialized = false;

  /**
   * Obtiene la instancia única del cliente Supabase
   */
  static getInstance(): SupabaseClient {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance!;
  }

  /**
   * Inicializa el cliente Supabase con configuración optimizada
   */
  private static initialize(): void {
    if (this.isInitialized) {
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.instance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Configuración optimizada para evitar múltiples instancias
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Reducir frecuencia de refresh para mejor rendimiento
        refreshTokenRetryInterval: 2000,
        // Configuración de storage optimizada
        storage: window.localStorage,
        storageKey: 'ondai-auth-token',
        // Configuración de debug solo en desarrollo
        debug: import.meta.env.DEV,
      },
      realtime: {
        // Configuración optimizada para realtime
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        // Headers optimizados
        headers: {
          'X-Client-Info': 'ondai-web-app',
        },
      },
    });

    this.isInitialized = true;
    
    // Log solo en desarrollo
    if (import.meta.env.DEV) {
      console.log('🔧 Supabase client initialized (singleton)');
    }
  }

  /**
   * Reinicia la instancia (útil para testing)
   */
  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
  }

  /**
   * Verifica si la instancia está inicializada
   */
  static isReady(): boolean {
    return this.isInitialized && this.instance !== null;
  }
}

// Exportar la instancia única
export const supabase = SupabaseSingleton.getInstance();

// Exportar la clase para testing
export { SupabaseSingleton };

// Exportar tipos útiles
export type { SupabaseClient };
