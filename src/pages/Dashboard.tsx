
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useViewFromUrlOrPersisted } from '@/hooks/usePersistedState';
import { useDataRefresh, useViewChangeDetector } from '@/hooks/useDataRefresh';
import Sidebar from '@/components/dashboard/Sidebar';
import MessagesView from '@/components/dashboard/MessagesView';
import CRMView from '@/components/dashboard/CRMView';
import StatsView from '@/components/dashboard/StatsView';
import ChannelsView from '@/components/dashboard/ChannelsView';
import ProfileView from '@/components/dashboard/ProfileView';
import SupportView from '@/components/dashboard/SupportView';
import AIAgentView from '@/components/dashboard/AIAgentView';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🎯 Nuevo sistema de persistencia de vistas
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
      console.log(`🎯 Vista cambiada, refrescando datos para: ${currentView}`);
      refreshViewData(currentView);
    }
  }, [currentView, detectViewChange, refreshViewData, user?.id]);

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
          title: "✅ WhatsApp conectado exitosamente",
          description: `Empresa: ${businessName}${phoneNumber ? ` - ${phoneNumber}` : ''}`,
        });
      } else if (pageId && pageName && channel) {
        toast({
          title: "✅ Conexión exitosa", 
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

  // 🎯 Función personalizada para cambiar vista con logging adicional
  const handleViewChange = (newView: string) => {
    console.log(`🎯 Dashboard: Changing view from ${currentView} to ${newView}`);
    setCurrentView(newView);
    
    // Opcional: Mostrar toast para debugging
    if (import.meta.env.DEV) {
      console.log(`📱 Vista activa: ${newView} (persistida en localStorage)`);
    }
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
    console.log(`🎯 Dashboard: Rendering view: ${currentView}`);
    
    switch (currentView) {
      case 'messages':
        console.log('📱 Rendering MessagesView');
        return <MessagesView />;
      case 'crm':
        console.log('👥 Rendering CRMView');
        return <CRMView />;
      case 'stats':
        console.log('📊 Rendering StatsView');
        return <StatsView />;
      case 'channels':
        console.log('⚙️ Rendering ChannelsView');
        return <ChannelsView />;
      case 'profile':
        console.log('👤 Rendering ProfileView');
        return <ProfileView user={user} />;
      case 'support':
        console.log('🔧 Rendering SupportView');
        return <SupportView />;
      case 'ai-agent':
        console.log('🤖 Rendering AIAgentView');
        return <AIAgentView />;
      default:
        console.log('📱 Rendering default MessagesView');
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
      {/* Sidebar fijo */}
      <div className="sticky top-0 h-screen">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={handleViewChange}
          onSignOut={handleSignOut}
          user={user}
        />
      </div>
      {/* Contenido principal con scroll */}
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
