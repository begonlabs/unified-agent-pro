import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useViewFromUrlOrPersisted } from '@/hooks/usePersistedState';
import { useDataRefresh, useViewChangeDetector } from '@/hooks/useDataRefresh';
import { useDashboardRenderer } from '@/hooks/useDashboardRenderer';
import { useDashboardOptimized } from '@/hooks/useDashboardOptimized';
import { AutoPreloader } from '@/components/lazy/LazyComponents';
import ResponsiveSidebarOptimized from '@/components/dashboard/sidebar/ResponsiveSidebarOptimized';
import { ChannelAlertBanner } from '@/components/dashboard/channels/components/ChannelAlertBanner';
import { ClientLimitModals } from '@/components/dashboard/ClientLimitModals';
import { ProfileService } from '@/components/dashboard/profile/services/profileService';
import { GlobalAccountLock } from '@/components/common/GlobalAccountLock';

/**
 * Dashboard optimizado con lazy loading y gestión de estado mejorada
 */
const DashboardOptimized: React.FC = () => {
  // Estados optimizados con refs para evitar re-renderizados
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Refs para valores que no necesitan re-renderizar
  const authSubscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Hooks optimizados
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useViewFromUrlOrPersisted('messages');
  const { refreshGlobalData, refreshViewData } = useDataRefresh();
  const { detectViewChange } = useViewChangeDetector();

  // Hook personalizado para renderizado optimizado
  const { renderCurrentView, renderAdminPanel, preloadInfo } = useDashboardRenderer();
  const { currentView: globalView, setCurrentView: setGlobalView } = useDashboardOptimized();

  /**
   * Función optimizada para manejar cambios de autenticación
   */
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (!isMountedRef.current) return;

    console.log('Auth state changed:', event, session?.user?.email);

    if (event === 'SIGNED_IN' && session) {
      setUser(session.user);
      setLoading(false);

      // Refrescar datos globales después del login
      refreshGlobalData();
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      setLoading(false);
      navigate('/auth');
    } else if (event === 'INITIAL_SESSION') {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    }
  }, [navigate, refreshGlobalData]);

  /**
   * Función optimizada para obtener sesión inicial
   */
  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session retrieved:', session?.user?.email);

      if (session) {
        setUser(session.user);
        refreshGlobalData();
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      navigate('/auth');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [navigate, refreshGlobalData]);

  /**
   * Función optimizada para cambiar vista
   */
  const handleViewChange = useCallback((newView: string) => {
    setCurrentView(newView); // URL param / Local state
    setGlobalView(newView as any); // Global AppStateContext used by renderer
    detectViewChange(newView);
    refreshViewData(newView);
  }, [setCurrentView, setGlobalView, detectViewChange, refreshViewData]);

  /**
   * Función optimizada para manejar persistencia
   */
  const handlePersistenceChange = useCallback(() => {
    const persisted = !!localStorage.getItem('dashboard-current-view');
    setIsPersisted(persisted);
  }, []);

  /**
   * Effect optimizado para inicialización
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Inicializar autenticación
    initializeAuth();

    // Setup user profile lock checking
    const checkLockStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const profile = await ProfileService.fetchProfile(session.user.id);
          if (profile && (profile.plan_type === 'none' || profile.payment_status === 'cancelled')) {
            setIsLocked(true);
          }
        }
      } catch (err) {
        console.error('Error checking profile lock:', err);
      }
    };
    checkLockStatus();

    // Configurar suscripción de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authSubscriptionRef.current = subscription;

    // Verificar persistencia inicial
    handlePersistenceChange();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
    };
  }, [initializeAuth, handleAuthStateChange, handlePersistenceChange]);

  /**
   * Effect para sincronizar la vista local/persistida con el estado global
   * Soluciona el error donde el contenido y el sidebar se descoordinan tras un refresh
   */
  useEffect(() => {
    if (currentView) {
      console.log('🔄 Sincronizando vista local con estado global:', currentView);
      setGlobalView(currentView as any);
    }
  }, [currentView, setGlobalView]);

  /**
   * Effect optimizado para detectar cambios de persistencia
   */
  useEffect(() => {
    const handleStorageChange = () => {
      handlePersistenceChange();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handlePersistenceChange]);

  /**
   * Valores memoizados para evitar re-renderizados innecesarios
   */
  const dashboardState = useMemo(() => ({
    user: user?.email || 'No user',
    loading,
    currentView,
    isPersisted,
    preloadPercentage: preloadInfo.preloadPercentage,
  }), [user?.email, loading, currentView, isPersisted, preloadInfo.preloadPercentage]);

  const handleSignOut = useCallback(async () => {
    try {
      toast({
        title: "Cerrando sesión...",
        description: "Redirigiendo...",
      });

      const { robustSignOut } = await import('@/lib/utils');
      await robustSignOut();
    } catch (error: unknown) {
      console.error('Error during sign out:', error);
      toast({
        title: "Error al cerrar sesión",
        description: "Redirigiendo de todas formas...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
  }, [toast]);

  /**
   * Props memoizadas para el sidebar
   */
  const sidebarProps = useMemo(() => ({
    currentView: globalView,
    onViewChange: handleViewChange,
    onSignOut: handleSignOut,
    user,
    isAdmin: false, // Se determinará dinámicamente
  }), [globalView, handleViewChange, handleSignOut, user]);

  /**
   * Renderizado condicional optimizado
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Se redirigirá a /auth
  }

  const urlParams = new URL(window.location.href).searchParams;
  const isPlansView = currentView === 'profile' && urlParams.get('tab') === 'plans';

  if (isLocked && !isPlansView) {
    return <GlobalAccountLock onSignOut={handleSignOut} />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* AutoPreloader para componentes críticos */}
      <AutoPreloader isAdmin={false} />

      {/* Sidebar optimizado */}
      <ResponsiveSidebarOptimized {...sidebarProps} />

      {/* Alertas Globales de Canales */}
      <ChannelAlertBanner />

      {/* Alertas de Límite de Contactos (CRM) */}
      <ClientLimitModals />

      {/* Contenido principal con lazy loading */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="h-full">
          {renderCurrentView(user)}
        </div>
      </main>

      {/* Panel de admin si es necesario */}
      {renderAdminPanel(user)}

      {/* Debug info solo en desarrollo */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-2 text-xs opacity-50 hover:opacity-100 transition-opacity">
          <div>View: {currentView}</div>
          <div>Preload: {preloadInfo.preloadPercentage}%</div>
          <div>Persisted: {isPersisted ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default DashboardOptimized;
