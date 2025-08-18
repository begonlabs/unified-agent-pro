
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import MessagesView from '@/components/dashboard/MessagesView';
import StatsView from '@/components/dashboard/StatsView';
import ChannelsView from '@/components/dashboard/ChannelsView';
import ProfileView from '@/components/dashboard/ProfileView';
import SupportView from '@/components/dashboard/SupportView';
import AIAgentView from '@/components/dashboard/AIAgentView';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('messages');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('Dashboard state:', { user: user?.email, loading });

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

  // Handle URL parameters for automatic view switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const successParam = urlParams.get('success');
    
    if (viewParam && ['messages', 'stats', 'channels', 'profile', 'support', 'ai-agent'].includes(viewParam)) {
      setCurrentView(viewParam);
      
      // If this is a successful OAuth callback, show success message
      if (successParam === 'true') {
        const pageId = urlParams.get('page_id');
        const pageName = urlParams.get('page_name');
        const channel = urlParams.get('channel');
        
        if (pageId && pageName && channel) {
          toast({
            title: "✅ Conexión exitosa",
            description: `${channel === 'facebook' ? 'Facebook' : 'Canal'} conectado: ${pageName}`,
          });
        }
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [toast]);

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
      case 'stats':
        return <StatsView />;
      case 'channels':
        return <ChannelsView />;
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
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
