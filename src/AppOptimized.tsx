import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { RoutePreloader } from '@/components/RoutePreloader';

// Lazy loading para páginas principales
const Index = React.lazy(() => import('@/pages/Index'));
const Auth = React.lazy(() => import('@/pages/Auth'));
const Dashboard = React.lazy(() => import('@/pages/DashboardOptimized'));
const AdminAuth = React.lazy(() => import('@/pages/AdminAuth'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const DataDeletion = React.lazy(() => import('@/pages/DataDeletion'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const OAuthCallback = React.lazy(() => import('@/pages/OAuthCallback'));
const TestEdge = React.lazy(() => import('@/pages/TestEdge'));

/**
 * Componente de loading optimizado
 */
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
    <div className="relative">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
    <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
  </div>
);

/**
 * Error boundary para componentes lazy
 */
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Algo salió mal</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * QueryClient optimizado con configuración de rendimiento
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración optimizada para mejor rendimiento
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (renombrado de cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Retry inteligente basado en el tipo de error
        if (error instanceof Error && error.message.includes('401')) {
          return false; // No retry en errores de autenticación
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Componente principal optimizado
 */
const App: React.FC = () => {
  /**
   * Effect para optimizaciones globales
   */
  useEffect(() => {
    // Optimizaciones de rendimiento
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silently fail if service worker registration fails
      });
    }

    // Preload de recursos críticos
    const preloadCriticalResources = () => {
      // Preload de fuentes críticas
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      fontLink.as = 'style';
      document.head.appendChild(fontLink);

      // Preload de imágenes críticas
      const logoImg = document.createElement('link');
      logoImg.rel = 'preload';
      logoImg.href = '/src/assets/logo.png';
      logoImg.as = 'image';
      document.head.appendChild(logoImg);
    };

    preloadCriticalResources();

    // Cleanup
    return () => {
      // Cleanup si es necesario
    };
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <BrowserRouter>
            <RoutePreloader>
              <Suspense fallback={<LoadingFallback message="Cargando aplicación..." />}>
                <Routes>
                  {/* Rutas principales */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/oauth/callback" element={<OAuthCallback />} />
                  
                  {/* Rutas del dashboard */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  
                  {/* Rutas de admin */}
                  <Route path="/admin/auth" element={<AdminAuth />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  
                  {/* Rutas de información */}
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/data-deletion" element={<DataDeletion />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Rutas de desarrollo */}
                  {import.meta.env.DEV && (
                    <Route path="/test-edge" element={<TestEdge />} />
                  )}
                  
                  {/* Ruta 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              
              {/* Toaster global */}
              <Toaster />
            </RoutePreloader>
          </BrowserRouter>
        </AppStateProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
