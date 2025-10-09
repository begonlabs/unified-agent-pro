import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing VITE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Singleton pattern para evitar múltiples instancias de Supabase
 * Resuelve el warning: "Multiple GoTrueClient instances detected"
 */
class SupabaseSingleton {
  private static instance: ReturnType<typeof createClient<Database>> | null = null;
  private static adminInstance: ReturnType<typeof createClient<Database>> | null = null;

  /**
   * Obtiene la instancia única del cliente Supabase (anon key)
   */
  static getInstance(): ReturnType<typeof createClient<Database>> {
    if (!this.instance) {
      this.instance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
          // Configuración optimizada para evitar múltiples instancias
          refreshTokenRetryInterval: 2000,
          storageKey: 'ondai-auth-token',
          debug: import.meta.env.DEV,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'ondai-web-app',
          },
        },
      });
    }
    return this.instance;
  }

  /**
   * Obtiene la instancia única del cliente Supabase Admin (service role)
   */
  static getAdminInstance(): ReturnType<typeof createClient<Database>> {
    if (!this.adminInstance) {
      this.adminInstance = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return this.adminInstance;
  }

  /**
   * Reinicia las instancias (útil para testing)
   */
  static reset(): void {
    this.instance = null;
    this.adminInstance = null;
  }
}

// Exportar las instancias únicas
export const supabase = SupabaseSingleton.getInstance();
export const supabaseAdmin = SupabaseSingleton.getAdminInstance();

// Exportar la clase para testing
export { SupabaseSingleton };

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";