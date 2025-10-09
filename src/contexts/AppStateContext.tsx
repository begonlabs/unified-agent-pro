import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';

/**
 * Tipos para el estado global de la aplicación
 */
interface AppState {
  // Autenticación
  user: User | null;
  isAuthenticated: boolean;
  
  // Admin
  isAdmin: boolean;
  adminLoading: boolean;
  adminError: string | null;
  
  // UI State
  currentView: 'messages' | 'ai-agent' | 'channels' | 'stats' | 'crm' | 'profile' | 'support';
  loading: boolean;
  error: string | null;
  
  // Persistencia
  isPersisted: boolean;
  
  // Notificaciones
  hasNewNotification: boolean;
  notificationCount: number;
  
  // Performance
  lastRefresh: number;
  refreshCount: number;
}

/**
 * Acciones disponibles para el reducer
 */
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ADMIN_STATUS'; payload: { isAdmin: boolean; loading: boolean; error?: string | null } }
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PERSISTED'; payload: boolean }
  | { type: 'SET_NOTIFICATION_COUNT'; payload: number }
  | { type: 'SET_HAS_NEW_NOTIFICATION'; payload: boolean }
  | { type: 'INCREMENT_REFRESH_COUNT' }
  | { type: 'RESET_STATE' }
  | { type: 'BATCH_UPDATE'; payload: Partial<AppState> };

/**
 * Estado inicial optimizado
 */
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  adminLoading: true,
  adminError: null,
  currentView: 'messages',
  loading: true,
  error: null,
  isPersisted: false,
  hasNewNotification: false,
  notificationCount: 0,
  lastRefresh: Date.now(),
  refreshCount: 0,
};

/**
 * Reducer optimizado con memoización
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
      
    case 'SET_ADMIN_STATUS':
      return {
        ...state,
        isAdmin: action.payload.isAdmin,
        adminLoading: action.payload.loading,
        adminError: action.payload.error || null,
      };
      
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case 'SET_PERSISTED':
      return {
        ...state,
        isPersisted: action.payload,
      };
      
    case 'SET_NOTIFICATION_COUNT':
      return {
        ...state,
        notificationCount: action.payload,
        hasNewNotification: action.payload > 0,
      };
      
    case 'SET_HAS_NEW_NOTIFICATION':
      return {
        ...state,
        hasNewNotification: action.payload,
      };
      
    case 'INCREMENT_REFRESH_COUNT':
      return {
        ...state,
        refreshCount: state.refreshCount + 1,
        lastRefresh: Date.now(),
      };
      
    case 'RESET_STATE':
      return initialState;
      
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload,
      };
      
    default:
      return state;
  }
}

/**
 * Contexto para el estado global
 */
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    setUser: (user: User | null) => void;
    setAdminStatus: (isAdmin: boolean, loading: boolean, error?: string | null) => void;
    setCurrentView: (view: AppState['currentView']) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPersisted: (persisted: boolean) => void;
    setNotificationCount: (count: number) => void;
    setHasNewNotification: (hasNew: boolean) => void;
    incrementRefreshCount: () => void;
    resetState: () => void;
    batchUpdate: (updates: Partial<AppState>) => void;
  };
} | null>(null);

/**
 * Provider optimizado para el estado global
 */
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Acciones memoizadas para evitar re-renderizados innecesarios
   */
  const actions = useMemo(() => ({
    setUser: useCallback((user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user });
    }, []),
    
    setAdminStatus: useCallback((isAdmin: boolean, loading: boolean, error?: string | null) => {
      dispatch({ type: 'SET_ADMIN_STATUS', payload: { isAdmin, loading, error } });
    }, []),
    
    setCurrentView: useCallback((view: AppState['currentView']) => {
      dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
    }, []),
    
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),
    
    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),
    
    setPersisted: useCallback((persisted: boolean) => {
      dispatch({ type: 'SET_PERSISTED', payload: persisted });
    }, []),
    
    setNotificationCount: useCallback((count: number) => {
      dispatch({ type: 'SET_NOTIFICATION_COUNT', payload: count });
    }, []),
    
    setHasNewNotification: useCallback((hasNew: boolean) => {
      dispatch({ type: 'SET_HAS_NEW_NOTIFICATION', payload: hasNew });
    }, []),
    
    incrementRefreshCount: useCallback(() => {
      dispatch({ type: 'INCREMENT_REFRESH_COUNT' });
    }, []),
    
    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, []),
    
    batchUpdate: useCallback((updates: Partial<AppState>) => {
      dispatch({ type: 'BATCH_UPDATE', payload: updates });
    }, []),
  }), []);

  /**
   * Valor del contexto memoizado
   */
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    actions,
  }), [state, actions]);

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * Hook para usar el estado global
 */
export const useAppState = () => {
  const context = useContext(AppStateContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};

/**
 * Hook para obtener solo el estado (sin acciones)
 */
export const useAppStateOnly = () => {
  const { state } = useAppState();
  return state;
};

/**
 * Hook para obtener solo las acciones (sin estado)
 */
export const useAppActions = () => {
  const { actions } = useAppState();
  return actions;
};

/**
 * Hook para obtener información específica del usuario
 */
export const useUserInfo = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    userId: state.user?.id || null,
    userEmail: state.user?.email || null,
    userName: state.user?.user_metadata?.name || state.user?.email?.split('@')[0] || 'Usuario',
  }), [state.user, state.isAuthenticated]);
};

/**
 * Hook para obtener información de admin
 */
export const useAdminInfo = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    isAdmin: state.isAdmin,
    adminLoading: state.adminLoading,
    adminError: state.adminError,
  }), [state.isAdmin, state.adminLoading, state.adminError]);
};

/**
 * Hook para obtener información de UI
 */
export const useUIState = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    currentView: state.currentView,
    loading: state.loading,
    error: state.error,
    isPersisted: state.isPersisted,
  }), [state.currentView, state.loading, state.error, state.isPersisted]);
};

/**
 * Hook para obtener información de notificaciones
 */
export const useNotificationState = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    hasNewNotification: state.hasNewNotification,
    notificationCount: state.notificationCount,
  }), [state.hasNewNotification, state.notificationCount]);
};

/**
 * Hook para obtener información de rendimiento
 */
export const usePerformanceState = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    lastRefresh: state.lastRefresh,
    refreshCount: state.refreshCount,
    timeSinceLastRefresh: Date.now() - state.lastRefresh,
  }), [state.lastRefresh, state.refreshCount]);
};

/**
 * Hook para debugging (solo en desarrollo)
 */
export const useAppStateDebug = () => {
  const { state } = useAppState();
  
  if (import.meta.env.DEV) {
    console.log('🔍 App State Debug:', {
      user: state.user?.email || 'No user',
      isAdmin: state.isAdmin,
      currentView: state.currentView,
      loading: state.loading,
      notificationCount: state.notificationCount,
      refreshCount: state.refreshCount,
    });
  }
  
  return state;
};
