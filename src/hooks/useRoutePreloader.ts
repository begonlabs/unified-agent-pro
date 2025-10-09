import React, { useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Configuración de rutas críticas con prioridades
 */
interface RouteConfig {
  path: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  preloadDelay: number; // ms
  dependencies?: string[]; // rutas que deben cargarse primero
  condition?: () => boolean; // condición para preload
}

/**
 * Configuración de rutas críticas
 */
const CRITICAL_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    priority: 'critical',
    preloadDelay: 0,
    dependencies: ['/auth']
  },
  {
    path: '/dashboard/messages',
    priority: 'critical',
    preloadDelay: 100,
    condition: () => true // Siempre preload
  },
  {
    path: '/dashboard/ai-agent',
    priority: 'high',
    preloadDelay: 500,
    condition: () => true
  },
  {
    path: '/dashboard/channels',
    priority: 'high',
    preloadDelay: 800,
    condition: () => true
  },
  {
    path: '/dashboard/stats',
    priority: 'medium',
    preloadDelay: 1000,
    condition: () => true
  },
  {
    path: '/dashboard/crm',
    priority: 'medium',
    preloadDelay: 1500,
    condition: () => true
  },
  {
    path: '/dashboard/profile',
    priority: 'low',
    preloadDelay: 2000,
    condition: () => true
  },
  {
    path: '/dashboard/support',
    priority: 'low',
    preloadDelay: 2500,
    condition: () => true
  },
  {
    path: '/admin',
    priority: 'high',
    preloadDelay: 300,
    condition: () => {
      // Solo preload si el usuario es admin
      const userRole = localStorage.getItem('user-role');
      return userRole === 'admin';
    }
  }
];

/**
 * Cache de componentes preloaded
 */
const preloadedComponents = new Map<string, React.ComponentType<any>>();
const preloadPromises = new Map<string, Promise<any>>();

/**
 * Función para preload de componentes
 */
async function preloadComponent(routePath: string): Promise<void> {
  if (preloadedComponents.has(routePath)) {
    return;
  }

  if (preloadPromises.has(routePath)) {
    return preloadPromises.get(routePath);
  }

  const promise = (async () => {
    try {
      let component: React.ComponentType<any>;
      
      switch (routePath) {
        case '/dashboard':
          component = (await import('@/pages/Dashboard')).default;
          break;
        case '/dashboard/messages':
          component = (await import('@/components/dashboard/MessagesView')).default;
          break;
        case '/dashboard/ai-agent':
          component = (await import('@/components/dashboard/ai-agent/AIAgentView')).default;
          break;
        case '/dashboard/channels':
          component = (await import('@/components/dashboard/channels/ChannelsView')).default;
          break;
        case '/dashboard/stats':
          component = (await import('@/components/dashboard/stats/StatsView')).default;
          break;
        case '/dashboard/crm':
          component = (await import('@/components/dashboard/crm/CRMView')).default;
          break;
        case '/dashboard/profile':
          component = (await import('@/components/dashboard/profile/ProfileView')).default;
          break;
        case '/dashboard/support':
          component = (await import('@/components/dashboard/support/SupportView')).default;
          break;
        case '/admin':
          component = (await import('@/pages/AdminDashboard')).default;
          break;
        default:
          return;
      }
      
      preloadedComponents.set(routePath, component);
      preloadPromises.delete(routePath);
      
      console.log(`✅ Preloaded component for route: ${routePath}`);
    } catch (error) {
      console.error(`❌ Failed to preload component for route: ${routePath}`, error);
      preloadPromises.delete(routePath);
    }
  })();

  preloadPromises.set(routePath, promise);
  return promise;
}

/**
 * Función para preload de dependencias
 */
async function preloadDependencies(route: RouteConfig): Promise<void> {
  if (route.dependencies) {
    for (const dependency of route.dependencies) {
      await preloadComponent(dependency);
    }
  }
}

/**
 * Función para preload inteligente basado en prioridad
 */
async function intelligentPreload(currentPath: string): Promise<void> {
  const currentRoute = CRITICAL_ROUTES.find(route => route.path === currentPath);
  if (!currentRoute) return;

  // Preload dependencias primero
  await preloadDependencies(currentRoute);

  // Preload rutas por prioridad
  const routesByPriority = CRITICAL_ROUTES.reduce((acc, route) => {
    if (!acc[route.priority]) {
      acc[route.priority] = [];
    }
    acc[route.priority].push(route);
    return acc;
  }, {} as Record<string, RouteConfig[]>);

  // Preload rutas críticas inmediatamente
  for (const route of routesByPriority.critical || []) {
    if (route.condition?.() !== false) {
      setTimeout(() => preloadComponent(route.path), route.preloadDelay);
    }
  }

  // Preload rutas de alta prioridad
  for (const route of routesByPriority.high || []) {
    if (route.condition?.() !== false) {
      setTimeout(() => preloadComponent(route.path), route.preloadDelay);
    }
  }

  // Preload rutas de prioridad media
  for (const route of routesByPriority.medium || []) {
    if (route.condition?.() !== false) {
      setTimeout(() => preloadComponent(route.path), route.preloadDelay);
    }
  }

  // Preload rutas de baja prioridad
  for (const route of routesByPriority.low || []) {
    if (route.condition?.() !== false) {
      setTimeout(() => preloadComponent(route.path), route.preloadDelay);
    }
  }
}

/**
 * Hook para preloading inteligente de rutas
 */
export const useRoutePreloader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Función para preload de rutas específicas
   */
  const preloadRoute = useCallback(async (routePath: string): Promise<void> => {
    await preloadComponent(routePath);
  }, []);

  /**
   * Función para preload de múltiples rutas
   */
  const preloadRoutes = useCallback(async (routePaths: string[]): Promise<void> => {
    await Promise.all(routePaths.map(route => preloadComponent(route)));
  }, []);

  /**
   * Función para preload inteligente basado en la ruta actual
   */
  const preloadBasedOnCurrentRoute = useCallback(async (): Promise<void> => {
    await intelligentPreload(location.pathname);
  }, [location.pathname]);

  /**
   * Función para navegación optimizada con preload
   */
  const navigateWithPreload = useCallback(async (path: string): Promise<void> => {
    // Preload el componente antes de navegar
    await preloadComponent(path);
    
    // Navegar
    navigate(path);
  }, [navigate]);

  /**
   * Función para obtener estadísticas de preload
   */
  const getPreloadStats = useCallback(() => {
    return {
      preloadedCount: preloadedComponents.size,
      pendingCount: preloadPromises.size,
      preloadedRoutes: Array.from(preloadedComponents.keys()),
      pendingRoutes: Array.from(preloadPromises.keys()),
    };
  }, []);

  /**
   * Effect para preload automático basado en la ruta actual
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadBasedOnCurrentRoute();
    }, 100);

    return () => clearTimeout(timer);
  }, [preloadBasedOnCurrentRoute]);

  return {
    preloadRoute,
    preloadRoutes,
    preloadBasedOnCurrentRoute,
    navigateWithPreload,
    getPreloadStats,
  };
};

/**
 * Hook para preloading basado en interacciones del usuario
 */
export const useInteractionBasedPreload = () => {
  const { preloadRoute } = useRoutePreloader();

  /**
   * Preload basado en hover de elementos de navegación
   */
  const handleNavigationHover = useCallback((routePath: string) => {
    // Preload después de un pequeño delay para evitar preloads innecesarios
    const timer = setTimeout(() => {
      preloadRoute(routePath);
    }, 200);

    return () => clearTimeout(timer);
  }, [preloadRoute]);

  /**
   * Preload basado en focus de elementos de navegación
   */
  const handleNavigationFocus = useCallback((routePath: string) => {
    preloadRoute(routePath);
  }, [preloadRoute]);

  return {
    handleNavigationHover,
    handleNavigationFocus,
  };
};

/**
 * Hook para preloading basado en tiempo de inactividad
 */
export const useIdlePreload = () => {
  const { preloadRoutes } = useRoutePreloader();

  /**
   * Preload durante tiempo de inactividad
   */
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    let isIdle = false;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      isIdle = false;
      
      idleTimer = setTimeout(() => {
        isIdle = true;
        // Preload rutas de baja prioridad durante inactividad
        const lowPriorityRoutes = CRITICAL_ROUTES
          .filter(route => route.priority === 'low')
          .map(route => route.path);
        
        preloadRoutes(lowPriorityRoutes);
      }, 5000); // 5 segundos de inactividad
    };

    // Eventos que resetean el timer de inactividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, [preloadRoutes]);
};

/**
 * Componente para preloading automático
 */
export const RoutePreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRoutePreloader();
  useInteractionBasedPreload();
  useIdlePreload();

  return <>{children}</>;
};

/**
 * Hook para obtener información de preloading
 */
export const usePreloadInfo = () => {
  const { getPreloadStats } = useRoutePreloader();

  return useMemo(() => {
    const stats = getPreloadStats();
    const totalRoutes = CRITICAL_ROUTES.length;
    const preloadPercentage = Math.round((stats.preloadedCount / totalRoutes) * 100);

    return {
      ...stats,
      totalRoutes,
      preloadPercentage,
      isFullyPreloaded: stats.preloadedCount === totalRoutes,
    };
  }, [getPreloadStats]);
};
