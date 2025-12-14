import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { PaymentSuccess } from "./pages/PaymentSuccess";
import { ProfileService } from '@/components/dashboard/profile/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { useViewFromUrlOrPersisted } from '@/hooks/usePersistedState';
import { useDataRefresh, useViewChangeDetector } from '@/hooks/useDataRefresh';
import { GlobalNotificationListener } from '@/components/dashboard/GlobalNotificationListener';
import {
  ResponsiveSidebar,
  MessagesView,
  CRMView,
  StatsView,
  ChannelsView,
  ProfileView,
  SupportView,
  AIAgentView
} from '@/components/dashboard';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Nuevo sistema de persistencia de vistas
  const [currentView, setCurrentView] = useViewFromUrlOrPersisted('messages');
  const { refreshGlobalData, refreshViewData } = useDataRefresh();
  const { detectViewChange } = useViewChangeDetector();

  console.log('Dashboard state:', {
    user: user?.email,
    loading,
    currentView,
    isPersisted: !!localStorage.getItem('dashboard-current-view')
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session retrieved:', session?.user?.email);
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 🔄 Detectar cambios de vista y refrescar datos específicos
  useEffect(() => {
    const hasViewChanged = detectViewChange(currentView);

    if (hasViewChanged && user?.id) {
      console.log(`Vista cambiada, refrescando datos para: ${currentView}`);
      refreshViewData(currentView);
    }
  }, [currentView, detectViewChange, refreshViewData, user?.id]);

  // 🔍 Check for incomplete profile and redirect
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (user?.id) {
        try {
          const profile = await ProfileService.fetchProfile(user.id);
          if (profile) {
            const isProfileIncomplete = !profile.first_name || !profile.last_name || !profile.country;

            // If profile is incomplete and we are not already on the profile view
            if (isProfileIncomplete && currentView !== 'profile') {
              console.log('⚠️ Profile incomplete, redirecting to profile view');
              toast({
                title: "Perfil incompleto",
                description: "Por favor completa tu nombre, apellido y país para continuar.",
                variant: "default",
              });
              setCurrentView('profile');
              // Update URL to reflect the change
              const newUrl = window.location.pathname + '?view=profile';
              window.history.replaceState({}, '', newUrl);
            }
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
        }
      }
    };

    if (user && !loading) {
      checkProfileCompletion();
    }
  }, [user, loading, currentView, setCurrentView, toast]);

  // Handle success parameters for OAuth callbacks (URL params for view are handled in useViewFromUrlOrPersisted)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');

    if (successParam === 'true') {
      const pageId = urlParams.get('page_id');
      const pageName = urlParams.get('page_name');
      const businessName = urlParams.get('business_name');
      const phoneNumber = urlParams.get('phone_number');
      const channel = urlParams.get('channel');

      // Mostrar notificación de éxito según el tipo de canal
      if (channel === 'whatsapp' && businessName) {
        toast({
          title: "WhatsApp conectado exitosamente",
          description: `Empresa: ${businessName}${phoneNumber ? ` - ${phoneNumber}` : ''}`,
        });
      } else if (pageId && pageName && channel) {
        toast({
          title: "Conexión exitosa",
          description: `${channel === 'facebook' ? 'Facebook' : 'Canal'} conectado: ${pageName}`,
        });
      }

      // Limpiar parámetros URL después de mostrar notificación
      setTimeout(() => {
        const newUrl = window.location.pathname + (window.location.search.includes('view=') ? `?view=${currentView}` : '');
        window.history.replaceState({}, '', newUrl);
      }, 2000);
    }
  }, [toast, currentView]);

  // Función personalizada para cambiar vista
  const handleViewChange = (newView: string) => {
    setCurrentView(newView);
  };

  const handleSignOut = async () => {
    try {
      toast({
        title: "Cerrando sesión...",
        description: "Redirigiendo...",
      });

      // Usar logout robusto
      const { robustSignOut } = await import('@/lib/utils');
      await robustSignOut();

    } catch (error: unknown) {
      console.error('Error during sign out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cerrar sesión';
      toast({
        title: "Error al cerrar sesión",
        description: "Redirigiendo de todas formas...",
        variant: "destructive",
      });

      // Forzar redirección incluso si hay error
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'messages':
        return <MessagesView />;
      case 'crm':
        return <CRMView user={user} />;
      case 'stats':
        return <StatsView />;
      case 'channels':
        return <ChannelsView user={user} />;
      case 'profile':
        return <ProfileView user={user} />;
      case 'support':
        return <SupportView />;
      case 'ai-agent':
        return <AIAgentView />;
      default:
        return <MessagesView />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Global Listeners */}
      <GlobalNotificationListener user={user} currentView={currentView} />

      {/* Sidebar responsive */}
      <ResponsiveSidebar
        currentView={currentView}
        setCurrentView={handleViewChange}
        onSignOut={handleSignOut}
        user={user}
      />
      {/* Contenido principal con scroll */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
