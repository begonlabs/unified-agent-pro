import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useViewFromUrlOrPersisted } from '@/hooks/usePersistedState';
import { useDataRefresh, useViewChangeDetector } from '@/hooks/useDataRefresh';
import { useDashboardRenderer } from '@/hooks/useDashboardRenderer';
import { AutoPreloader } from '@/components/lazy/LazyComponents';
import { ResponsiveSidebar } from '@/components/dashboard';

/**
 * Dashboard optimizado con lazy loading y gestión de estado mejorada
 */
const DashboardOptimized: React.FC = () => {
  // Estados optimizados con refs para evitar re-renderizados
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPersisted, setIsPersisted] = useState(false);
  
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
      refreshGlobalData(session.user.id);
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
        refreshGlobalData(session.user.id);
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
    setCurrentView(newView);
    detectViewChange(newView);
    refreshViewData();
  }, [setCurrentView, detectViewChange, refreshViewData]);

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

  /**
   * Props memoizadas para el sidebar
   */
  const sidebarProps = useMemo(() => ({
    currentView,
    onViewChange: handleViewChange,
    user,
    isAdmin: false, // Se determinará dinámicamente
  }), [currentView, handleViewChange, user]);

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

  return (
    <div className="flex h-screen bg-background">
      {/* AutoPreloader para componentes críticos */}
      <AutoPreloader isAdmin={false} />
      
      {/* Sidebar optimizado */}
      <ResponsiveSidebar {...sidebarProps} />
      
      {/* Contenido principal con lazy loading */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {renderCurrentView()}
        </div>
      </main>
      
      {/* Panel de admin si es necesario */}
      {renderAdminPanel()}
      
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
