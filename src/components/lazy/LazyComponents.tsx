import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Componente de loading optimizado con skeleton
 */
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="relative">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-primary/20" />
    </div>
    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    
    {/* Skeleton para diferentes tipos de contenido */}
    <div className="w-full max-w-md space-y-3">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
    </div>
  </div>
);

/**
 * Error boundary para componentes lazy
 */
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
          <div className="text-destructive text-center">
            <h3 className="text-lg font-semibold mb-2">Error al cargar componente</h3>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper optimizado para componentes lazy
 */
const LazyWrapper: React.FC<{
  children: React.ReactNode;
  loadingMessage?: string;
  errorFallback?: React.ReactNode;
}> = ({ children, loadingMessage, errorFallback }) => (
  <LazyErrorBoundary fallback={errorFallback}>
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      {children}
    </Suspense>
  </LazyErrorBoundary>
);

/**
 * Función para crear componentes lazy con preloading
 */
function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  loadingMessage?: string,
  errorFallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <LazyWrapper loadingMessage={loadingMessage} errorFallback={errorFallback}>
      <LazyComponent {...props} ref={ref} />
    </LazyWrapper>
  ));
}

/**
 * Componentes lazy del Dashboard con preloading optimizado
 */

// Componentes principales del Dashboard
export const MessagesView = createLazyComponent(
  () => import('@/components/dashboard/MessagesView'),
  'Cargando mensajes...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar mensajes</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar la vista de mensajes</p>
  </div>
);

export const AIAgentView = createLazyComponent(
  () => import('@/components/dashboard/ai-agent/AIAgentView'),
  'Cargando agente IA...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar agente IA</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar la configuración del agente</p>
  </div>
);

export const ChannelsView = createLazyComponent(
  () => import('@/components/dashboard/channels/ChannelsView'),
  'Cargando canales...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar canales</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar la configuración de canales</p>
  </div>
);

export const StatsView = createLazyComponent(
  () => import('@/components/dashboard/stats/StatsView'),
  'Cargando estadísticas...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar estadísticas</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar las estadísticas</p>
  </div>
);

export const CRMView = createLazyComponent(
  () => import('@/components/dashboard/crm/CRMView'),
  'Cargando CRM...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar CRM</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar el sistema CRM</p>
  </div>
);

export const ProfileView = createLazyComponent(
  () => import('@/components/dashboard/profile/ProfileView'),
  'Cargando perfil...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar perfil</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar el perfil del usuario</p>
  </div>
);

export const SupportView = createLazyComponent(
  () => import('@/components/dashboard/support/SupportView'),
  'Cargando soporte...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar soporte</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar el sistema de soporte</p>
  </div>
);

// Componentes del Admin Panel
export const AdminDashboard = createLazyComponent(
  () => import('@/components/admin/admin-panel/AdminPanel'),
  'Cargando panel de administración...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar panel admin</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar el panel de administración</p>
  </div>
);

export const AdminStats = createLazyComponent(
  () => import('@/components/admin/general-stats/GeneralStats'),
  'Cargando estadísticas generales...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar estadísticas</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar las estadísticas generales</p>
  </div>
);

export const ClientStats = createLazyComponent(
  () => import('@/components/admin/client-stats/ClientStats'),
  'Cargando estadísticas de clientes...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar estadísticas de clientes</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar las estadísticas de clientes</p>
  </div>
);

export const AdminUsers = createLazyComponent(
  () => import('@/components/admin/users/ClientManagement'),
  'Cargando gestión de usuarios...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar usuarios</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar la gestión de usuarios</p>
  </div>
);

export const AdminSupport = createLazyComponent(
  () => import('@/components/admin/support/SupportMessages'),
  'Cargando mensajes de soporte...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar soporte</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar los mensajes de soporte</p>
  </div>
);

export const AdminSettings = createLazyComponent(
  () => import('@/components/admin/settings/AdminSettings'),
  'Cargando configuración...',
  <div className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Error al cargar configuración</h3>
    <p className="text-sm text-muted-foreground">No se pudo cargar la configuración del sistema</p>
  </div>
);

/**
 * Sistema de preloading inteligente
 */
class ComponentPreloader {
  private preloadedComponents = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Preload un componente específico
   */
  async preloadComponent(name: string, importFunc: () => Promise<any>): Promise<void> {
    if (this.preloadedComponents.has(name)) {
      return;
    }

    if (this.preloadPromises.has(name)) {
      return this.preloadPromises.get(name);
    }

    const promise = importFunc().then(module => {
      this.preloadedComponents.add(name);
      this.preloadPromises.delete(name);
      return module;
    });

    this.preloadPromises.set(name, promise);
    return promise;
  }

  /**
   * Preload componentes críticos del dashboard
   */
  async preloadCriticalComponents(): Promise<void> {
    const criticalComponents = [
      { name: 'MessagesView', importFunc: () => import('@/components/dashboard/MessagesView') },
      { name: 'AIAgentView', importFunc: () => import('@/components/dashboard/ai-agent/AIAgentView') },
      { name: 'ChannelsView', importFunc: () => import('@/components/dashboard/channels/ChannelsView') },
    ];

    await Promise.all(
      criticalComponents.map(comp => 
        this.preloadComponent(comp.name, comp.importFunc)
      )
    );
  }

  /**
   * Preload componentes del admin panel
   */
  async preloadAdminComponents(): Promise<void> {
    const adminComponents = [
      { name: 'AdminDashboard', importFunc: () => import('@/components/admin/admin-panel/AdminPanel') },
      { name: 'AdminStats', importFunc: () => import('@/components/admin/general-stats/GeneralStats') },
      { name: 'ClientStats', importFunc: () => import('@/components/admin/client-stats/ClientStats') },
    ];

    await Promise.all(
      adminComponents.map(comp => 
        this.preloadComponent(comp.name, comp.importFunc)
      )
    );
  }

  /**
   * Verificar si un componente está preloaded
   */
  isPreloaded(name: string): boolean {
    return this.preloadedComponents.has(name);
  }

  /**
   * Obtener estadísticas de preloading
   */
  getStats() {
    return {
      preloadedCount: this.preloadedComponents.size,
      pendingCount: this.preloadPromises.size,
      preloadedComponents: Array.from(this.preloadedComponents),
    };
  }
}

// Instancia global del preloader
export const componentPreloader = new ComponentPreloader();

/**
 * Hook para usar el preloader
 */
export const useComponentPreloader = () => {
  return {
    preloadCriticalComponents: () => componentPreloader.preloadCriticalComponents(),
    preloadAdminComponents: () => componentPreloader.preloadAdminComponents(),
    isPreloaded: (name: string) => componentPreloader.isPreloaded(name),
    getStats: () => componentPreloader.getStats(),
  };
};

/**
 * Componente para preloading automático
 */
export const AutoPreloader: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const { preloadCriticalComponents, preloadAdminComponents } = useComponentPreloader();

  React.useEffect(() => {
    // Preload componentes críticos inmediatamente
    preloadCriticalComponents();

    // Preload componentes de admin si es necesario
    if (isAdmin) {
      preloadAdminComponents();
    }

    // Preload adicional después de un delay
    const timer = setTimeout(() => {
      if (isAdmin) {
        preloadAdminComponents();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAdmin, preloadCriticalComponents, preloadAdminComponents]);

  return null;
};
