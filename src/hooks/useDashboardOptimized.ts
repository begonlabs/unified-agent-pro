import { useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { useAppState, useAppActions } from '@/contexts/AppStateContext';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Hook optimizado para el Dashboard que integra el estado global
 * y evita re-renderizados innecesarios
 */
export const useDashboardOptimized = () => {
  const { state } = useAppState();
  const actions = useAppActions();
  
  // Usar el hook useAdmin optimizado
  const { isAdmin, loading: adminLoading, error: adminError, refetch: refetchAdmin } = useAdmin(state.user);

  /**
   * Sincronizar estado de admin con el contexto global
   */
  useEffect(() => {
    actions.setAdminStatus(isAdmin, adminLoading, adminError);
  }, [isAdmin, adminLoading, adminError, actions]);

  /**
   * Función optimizada para cambiar vista
   */
  const setCurrentView = useCallback((view: typeof state.currentView) => {
    actions.setCurrentView(view);
  }, [actions]);

  /**
   * Función optimizada para manejar errores
   */
  const handleError = useCallback((error: string | null) => {
    actions.setError(error);
    actions.setLoading(false);
  }, [actions]);

  /**
   * Función optimizada para manejar carga
   */
  const setLoading = useCallback((loading: boolean) => {
    actions.setLoading(loading);
  }, [actions]);

  /**
   * Función optimizada para actualizar notificaciones
   */
  const updateNotifications = useCallback((count: number, hasNew: boolean = false) => {
    actions.setNotificationCount(count);
    actions.setHasNewNotification(hasNew);
  }, [actions]);

  /**
   * Función optimizada para refrescar datos
   */
  const refreshData = useCallback(() => {
    actions.incrementRefreshCount();
    // Refrescar datos de admin si es necesario
    if (state.user) {
      refetchAdmin();
    }
  }, [actions, state.user, refetchAdmin]);

  /**
   * Función optimizada para resetear estado
   */
  const resetState = useCallback(() => {
    actions.resetState();
  }, [actions]);

  /**
   * Función optimizada para actualización en lote
   */
  const batchUpdate = useCallback((updates: Partial<typeof state>) => {
    actions.batchUpdate(updates);
  }, [actions]);

  /**
   * Valores memoizados para evitar re-renderizados innecesarios
   */
  const dashboardState = useMemo(() => ({
    // Estado de autenticación
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    userId: state.user?.id || null,
    userEmail: state.user?.email || null,
    
    // Estado de admin
    isAdmin: state.isAdmin,
    adminLoading: state.adminLoading,
    adminError: state.adminError,
    
    // Estado de UI
    currentView: state.currentView,
    loading: state.loading,
    error: state.error,
    isPersisted: state.isPersisted,
    
    // Estado de notificaciones
    hasNewNotification: state.hasNewNotification,
    notificationCount: state.notificationCount,
    
    // Estado de rendimiento
    lastRefresh: state.lastRefresh,
    refreshCount: state.refreshCount,
  }), [
    state.user,
    state.isAuthenticated,
    state.isAdmin,
    state.adminLoading,
    state.adminError,
    state.currentView,
    state.loading,
    state.error,
    state.isPersisted,
    state.hasNewNotification,
    state.notificationCount,
    state.lastRefresh,
    state.refreshCount,
  ]);

  /**
   * Acciones memoizadas
   */
  const dashboardActions = useMemo(() => ({
    setCurrentView,
    handleError,
    setLoading,
    updateNotifications,
    refreshData,
    resetState,
    batchUpdate,
    refetchAdmin,
  }), [
    setCurrentView,
    handleError,
    setLoading,
    updateNotifications,
    refreshData,
    resetState,
    batchUpdate,
    refetchAdmin,
  ]);

  return {
    ...dashboardState,
    ...dashboardActions,
  };
};

/**
 * Hook específico para información del usuario
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
 * Hook específico para información de admin
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
 * Hook específico para estado de UI
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
 * Hook específico para notificaciones
 */
export const useNotificationState = () => {
  const { state } = useAppState();
  
  return useMemo(() => ({
    hasNewNotification: state.hasNewNotification,
    notificationCount: state.notificationCount,
  }), [state.hasNewNotification, state.notificationCount]);
};
