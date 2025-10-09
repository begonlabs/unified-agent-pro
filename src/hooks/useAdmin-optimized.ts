import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Cache para roles de usuario para evitar consultas repetidas
 */
const roleCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Debounce utility para evitar llamadas excesivas
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface UseAdminReturn {
  isAdmin: boolean;
  loading: boolean;
  userId: string | null;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook optimizado para verificar roles de administrador
 * - Implementa cache para evitar consultas repetidas
 * - Usa debounce para evitar llamadas excesivas
 * - Memoización para evitar re-renderizados innecesarios
 * - Manejo de errores mejorado
 */
export const useAdmin = (user: User | null): UseAdminReturn => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para evitar llamadas durante desmontaje
  const isMountedRef = useRef(true);
  
  // Memoizar el userId para evitar re-renderizados innecesarios
  const userId = useMemo(() => user?.id || null, [user?.id]);

  /**
   * Función optimizada para verificar rol de admin
   */
  const checkAdminRole = useCallback(async (userId: string): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      setError(null);
      
      // Verificar cache primero
      const cached = roleCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (isMountedRef.current) {
          setIsAdmin(cached.isAdmin);
          setLoading(false);
        }
        return;
      }

      // Consulta optimizada con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        // Primero intentar consulta directa (más rápida)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        clearTimeout(timeoutId);

        if (roleError) {
          console.warn('Direct role query failed, trying RPC:', roleError.message);
          
          // Fallback a RPC function
          const { data: rpcData, error: rpcError } = await supabase.rpc('has_role', {
            _user_id: userId,
            _role: 'admin'
          });

          if (rpcError) {
            throw new Error(`RPC error: ${rpcError.message}`);
          }

          const adminStatus = rpcData || false;
          
          // Actualizar cache
          roleCache.set(userId, { isAdmin: adminStatus, timestamp: Date.now() });
          
          if (isMountedRef.current) {
            setIsAdmin(adminStatus);
          }
        } else {
          const adminStatus = !!roleData;
          
          // Actualizar cache
          roleCache.set(userId, { isAdmin: adminStatus, timestamp: Date.now() });
          
          if (isMountedRef.current) {
            setIsAdmin(adminStatus);
          }
        }
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw abortError;
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
      
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsAdmin(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Función debounced para evitar llamadas excesivas
   */
  const debouncedCheckRole = useMemo(
    () => debounce(checkAdminRole, 300),
    [checkAdminRole]
  );

  /**
   * Función para refetch manual
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!userId) return;
    
    // Limpiar cache para forzar nueva consulta
    roleCache.delete(userId);
    setLoading(true);
    setError(null);
    
    await checkAdminRole(userId);
  }, [userId, checkAdminRole]);

  /**
   * Effect principal con optimizaciones
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      setError(null);
      return;
    }

    // Verificar cache inmediatamente
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setIsAdmin(cached.isAdmin);
      setLoading(false);
      setError(null);
      return;
    }

    // Usar debounced check para evitar llamadas excesivas
    debouncedCheckRole(userId);

    // Cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, [userId, debouncedCheckRole]);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoizar el valor de retorno para evitar re-renderizados innecesarios
  return useMemo(() => ({
    isAdmin,
    loading,
    userId,
    error,
    refetch
  }), [isAdmin, loading, userId, error, refetch]);
};

/**
 * Hook para limpiar cache de roles (útil para testing o logout)
 */
export const useClearRoleCache = () => {
  return useCallback(() => {
    roleCache.clear();
  }, []);
};

/**
 * Hook para obtener estadísticas del cache
 */
export const useRoleCacheStats = () => {
  return useMemo(() => ({
    cacheSize: roleCache.size,
    cachedUsers: Array.from(roleCache.keys()),
    oldestEntry: roleCache.size > 0 
      ? Math.min(...Array.from(roleCache.values()).map(v => v.timestamp))
      : null
  }), []);
};
