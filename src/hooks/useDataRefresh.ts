import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para manejar actualizaciones automáticas de datos
 * Se ejecuta cuando se cambia de vista o se hace refresh
 */
export function useDataRefresh() {
  const { user } = useAuth();
  const { toast } = useToast();
  const refreshCountRef = useRef(0);
  const lastRefreshRef = useRef<number>(0);

  // Función para refrescar datos globales
  const refreshGlobalData = useCallback(async () => {
    if (!user?.id) {
      console.log('👤 No user available for data refresh');
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Evitar refresh muy frecuentes (mínimo 5 segundos entre refreshes)
    if (timeSinceLastRefresh < 5000) {
      console.log('🚫 Refresh skipped - too recent (within 5s)');
      return;
    }

    try {
      refreshCountRef.current += 1;
      lastRefreshRef.current = now;
      
      // Global data refresh initiated

      // Aquí puedes agregar lógica específica para refrescar datos
      // Por ejemplo, invalidar caches, refrescar tokens, etc.
      
      // Disparar evento personalizado que los componentes pueden escuchar
      window.dispatchEvent(new CustomEvent('dataRefresh', {
        detail: {
          userId: user.id,
          timestamp: now,
          refreshCount: refreshCountRef.current
        }
      }));

      // Global data refresh completed successfully

    } catch (error) {
      console.error('Error during global data refresh:', error);
      toast({
        title: "Error actualizando datos",
        description: "Algunos datos pueden estar desactualizados",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Función para refrescar datos específicos de una vista
  const refreshViewData = useCallback(async (viewName: string) => {
    if (!user?.id) return;

    // Refreshing data for view

    // Disparar evento específico para la vista
    window.dispatchEvent(new CustomEvent('viewDataRefresh', {
      detail: {
        viewName,
        userId: user.id,
        timestamp: Date.now()
      }
    }));
  }, [user]);

  // Refrescar datos al montar (útil después de refresh de página)
  useEffect(() => {
    if (user?.id) {
      // Pequeño delay para asegurar que los componentes estén montados
      const timer = setTimeout(() => {
        refreshGlobalData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user?.id, refreshGlobalData]);

  return {
    refreshGlobalData,
    refreshViewData,
    refreshCount: refreshCountRef.current
  };
}

/**
 * Hook para que los componentes se suscriban a eventos de refresh
 */
export function useRefreshListener(
  onRefresh?: () => void | Promise<void>,
  viewName?: string
) {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    if (!callbackRef.current) return;

    // Listener para refresh global
    const handleGlobalRefresh = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Component received global refresh event:', customEvent.detail);
      
      if (callbackRef.current) {
        try {
          await callbackRef.current();
        } catch (error) {
          console.error('Error in component refresh callback:', error);
        }
      }
    };

    // Listener para refresh específico de vista
    const handleViewRefresh = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { viewName: eventViewName } = customEvent.detail;
      
      // Solo refrescar si coincide con nuestra vista o no especificamos vista
      if (!viewName || eventViewName === viewName) {
        console.log(`Component received view refresh for: ${eventViewName}`);
        
        if (callbackRef.current) {
          try {
            await callbackRef.current();
          } catch (error) {
            console.error('Error in component view refresh callback:', error);
          }
        }
      }
    };

    // Agregar listeners
    window.addEventListener('dataRefresh', handleGlobalRefresh);
    window.addEventListener('viewDataRefresh', handleViewRefresh);

    return () => {
      window.removeEventListener('dataRefresh', handleGlobalRefresh);
      window.removeEventListener('viewDataRefresh', handleViewRefresh);
    };
  }, [viewName]);
}

/**
 * Hook para componentes que necesitan detectar cambios de vista
 */
export function useViewChangeDetector() {
  const previousViewRef = useRef<string>('');

  const detectViewChange = useCallback((currentView: string): boolean => {
    const hasChanged = previousViewRef.current !== '' && previousViewRef.current !== currentView;
    
    if (hasChanged) {
      console.log(`🔄 View change detected: ${previousViewRef.current} → ${currentView}`);
    }
    
    previousViewRef.current = currentView;
    return hasChanged;
  }, []);

  return { detectViewChange };
}
