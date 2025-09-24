import { useState, useEffect } from 'react';

/**
 * Hook personalizado para persistir estado en localStorage
 * @param key - Clave para localStorage 
 * @param defaultValue - Valor por defecto si no existe en localStorage
 * @param options - Opciones adicionales
 * @returns [valor, setter] similar a useState
 */
export function usePersistedState<T>(
  key: string, 
  defaultValue: T, 
  options?: {
    serializer?: {
      serialize: (value: T) => string;
      deserialize: (value: string) => T;
    };
    validator?: (value: unknown) => boolean;
  }
) {
  const { serializer = {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  }, validator } = options || {};

  // Estado inicial: intentar cargar desde localStorage
  const [state, setState] = useState<T>(() => {
    try {
      // Solo intentar acceder a localStorage en el cliente
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      const parsed = serializer.deserialize(item);
      
      // Si hay un validador, usarlo para verificar el valor
      if (validator && !validator(parsed)) {
        console.warn(`Invalid persisted value for key "${key}":`, parsed);
        return defaultValue;
      }

      console.log(`🔄 Restored persisted state for "${key}":`, parsed);
      return parsed;
    } catch (error) {
      console.error(`Error loading persisted state for key "${key}":`, error);
      return defaultValue;
    }
  });

  // Efecto para sincronizar con localStorage cuando cambie el estado
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (state === defaultValue) {
          // Si es el valor por defecto, remover de localStorage para mantenerlo limpio
          window.localStorage.removeItem(key);
          // Removed default value from localStorage
        } else {
          const serialized = serializer.serialize(state);
          window.localStorage.setItem(key, serialized);
          console.log(`💾 Persisted state for "${key}":`, state);
        }
      }
    } catch (error) {
      console.error(`Error saving persisted state for key "${key}":`, error);
    }
  }, [key, state, serializer, defaultValue]);

  // Función para limpiar el estado persistido
  const clearPersistedState = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        console.log(`🧹 Cleared persisted state for "${key}"`);
      }
      setState(defaultValue);
    } catch (error) {
      console.error(`Error clearing persisted state for key "${key}":`, error);
    }
  };

  return [state, setState, clearPersistedState] as const;
}

/**
 * Hook especializado para persistir la vista actual del dashboard
 */
export function usePersistedDashboardView(defaultView: string = 'messages') {
  // Validador para asegurar que la vista sea válida
  const validViews = ['messages', 'crm', 'stats', 'channels', 'profile', 'support', 'ai-agent'];
  
  const validator = (value: unknown): boolean => {
    return typeof value === 'string' && validViews.includes(value);
  };

  const [currentView, setCurrentView, clearView] = usePersistedState(
    'dashboard-current-view',
    defaultView,
    { validator }
  );

  // Función helper para cambiar vista con logging
  const changeView = (newView: string) => {
    if (!validViews.includes(newView)) {
      console.warn(`Invalid view "${newView}". Valid views:`, validViews);
      return;
    }
    
    // Changing dashboard view
    setCurrentView(newView);
  };

  return [currentView, changeView, clearView] as const;
}

/**
 * Hook para manejar URL parameters con fallback a estado persistido
 */
export function useViewFromUrlOrPersisted(defaultView: string = 'messages') {
  const [persistedView, setPersistedView] = usePersistedDashboardView(defaultView);
  const [urlView, setUrlView] = useState<string | null>(null);

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam && ['messages', 'crm', 'stats', 'channels', 'profile', 'support', 'ai-agent'].includes(viewParam)) {
        console.log(`🌐 URL parameter detected: view=${viewParam}`);
        setUrlView(viewParam);
        // También actualizar el estado persistido
        setPersistedView(viewParam);
        return viewParam;
      }
      
      return null;
    };

    // Verificar al montar
    checkUrlParams();

    // Limpiar URL parameters después de procesarlos
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('view')) {
        url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
        console.log('🧹 Cleaned view parameter from URL');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [setPersistedView]);

  // Prioridad: URL param > Persisted state > Default
  const currentView = urlView || persistedView;
  
  const setCurrentView = (view: string) => {
    setUrlView(null); // Limpiar URL override
    setPersistedView(view); // Actualizar estado persistido
  };

  return [currentView, setCurrentView] as const;
}
