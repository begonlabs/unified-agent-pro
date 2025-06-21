
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import MessagesView from '@/components/dashboard/MessagesView';
import StatsView from '@/components/dashboard/StatsView';
import ChannelsView from '@/components/dashboard/ChannelsView';
import ProfileView from '@/components/dashboard/ProfileView';
import SupportView from '@/components/dashboard/SupportView';
import AIAgentView from '@/components/dashboard/AIAgentView';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('messages');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderCurrentView = () => {
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="font-mono text-zinc-400 tracking-wider uppercase">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-zinc-950">
        <AppSidebar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          onSignOut={handleSignOut}
        />
        <SidebarInset>
          <main className="flex-1 overflow-hidden bg-zinc-900">
            <div className="h-screen overflow-y-auto">
              {renderCurrentView()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
