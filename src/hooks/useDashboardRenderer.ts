import React, { useMemo, useCallback } from 'react';
import { useDashboardOptimized } from '@/hooks/useDashboardOptimized';
import { useComponentPreloader } from '@/components/lazy/LazyComponents';

/**
 * Hook optimizado para renderizar componentes del dashboard con lazy loading
 */
export const useDashboardRenderer = () => {
  const dashboardState = useDashboardOptimized();
  const { isPreloaded } = useComponentPreloader();

  /**
   * Función optimizada para renderizar el contenido actual
   */
  const renderCurrentView = useCallback(() => {
    const { currentView } = dashboardState;

    // Importaciones dinámicas con lazy loading
    switch (currentView) {
      case 'messages':
        const MessagesView = React.lazy(() => import('@/components/dashboard/MessagesView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando mensajes...</p>
            </div>
          }>
            <MessagesView />
          </React.Suspense>
        );

      case 'ai-agent':
        const AIAgentView = React.lazy(() => import('@/components/dashboard/ai-agent/AIAgentView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando agente IA...</p>
            </div>
          }>
            <AIAgentView />
          </React.Suspense>
        );

      case 'channels':
        const ChannelsView = React.lazy(() => import('@/components/dashboard/channels/ChannelsView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando canales...</p>
            </div>
          }>
            <ChannelsView />
          </React.Suspense>
        );

      case 'stats':
        const StatsView = React.lazy(() => import('@/components/dashboard/stats/StatsView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando estadísticas...</p>
            </div>
          }>
            <StatsView />
          </React.Suspense>
        );

      case 'crm':
        const CRMView = React.lazy(() => import('@/components/dashboard/crm/CRMView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando CRM...</p>
            </div>
          }>
            <CRMView />
          </React.Suspense>
        );

      case 'profile':
        const ProfileView = React.lazy(() => import('@/components/dashboard/profile/ProfileView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando perfil...</p>
            </div>
          }>
            <ProfileView />
          </React.Suspense>
        );

      case 'support':
        const SupportView = React.lazy(() => import('@/components/dashboard/support/SupportView'));
        return (
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Cargando soporte...</p>
            </div>
          }>
            <SupportView />
          </React.Suspense>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <h3 className="text-lg font-semibold">Vista no encontrada</h3>
            <p className="text-sm text-muted-foreground">La vista "{currentView}" no está disponible</p>
          </div>
        );
    }
  }, [dashboardState.currentView]);

  /**
   * Función optimizada para renderizar el panel de admin
   */
  const renderAdminPanel = useCallback(() => {
    if (!dashboardState.isAdmin) {
      return null;
    }

    const AdminDashboard = React.lazy(() => import('@/components/admin/admin-panel/AdminPanel'));
    
    return (
      <React.Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="relative">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Cargando panel de administración...</p>
        </div>
      }>
        <AdminDashboard />
      </React.Suspense>
    );
  }, [dashboardState.isAdmin]);

  /**
   * Información de preloading memoizada
   */
  const preloadInfo = useMemo(() => {
    const components = ['MessagesView', 'AIAgentView', 'ChannelsView', 'StatsView', 'CRMView', 'ProfileView', 'SupportView'];
    const adminComponents = ['AdminDashboard', 'AdminStats', 'ClientStats', 'AdminUsers', 'AdminSupport', 'AdminSettings'];
    
    const allComponents = dashboardState.isAdmin 
      ? [...components, ...adminComponents]
      : components;

    return {
      totalComponents: allComponents.length,
      preloadedComponents: allComponents.filter(comp => isPreloaded(comp)),
      preloadPercentage: Math.round(
        (allComponents.filter(comp => isPreloaded(comp)).length / allComponents.length) * 100
      ),
    };
  }, [dashboardState.isAdmin, isPreloaded]);

  return {
    ...dashboardState,
    renderCurrentView,
    renderAdminPanel,
    preloadInfo,
  };
};

/**
 * Hook para optimizar la navegación entre vistas
 */
export const useNavigationOptimizer = () => {
  const { setCurrentView, currentView } = useDashboardOptimized();
  const { preloadCriticalComponents, preloadAdminComponents } = useComponentPreloader();

  /**
   * Navegación optimizada con preloading
   */
  const navigateTo = useCallback(async (view: Parameters<typeof setCurrentView>[0]) => {
    // Preload componentes relacionados antes de cambiar vista
    if (view === 'ai-agent' || view === 'channels' || view === 'stats') {
      await preloadCriticalComponents();
    }
    
    if (view === 'admin' && dashboardState.isAdmin) {
      await preloadAdminComponents();
    }

    // Cambiar vista
    setCurrentView(view);
  }, [setCurrentView, preloadCriticalComponents, preloadAdminComponents]);

  /**
   * Navegación rápida sin preloading (para casos urgentes)
   */
  const navigateToImmediate = useCallback((view: Parameters<typeof setCurrentView>[0]) => {
    setCurrentView(view);
  }, [setCurrentView]);

  return {
    navigateTo,
    navigateToImmediate,
    currentView,
  };
};
