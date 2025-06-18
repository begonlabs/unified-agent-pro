
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import Sidebar from '@/components/dashboard/Sidebar';
import MessagesView from '@/components/dashboard/MessagesView';
import StatsView from '@/components/dashboard/StatsView';
import ChannelsView from '@/components/dashboard/ChannelsView';
import ProfileView from '@/components/dashboard/ProfileView';
import SupportView from '@/components/dashboard/SupportView';
import AIAgentView from '@/components/dashboard/AIAgentView';
import AdminPanel from '@/components/admin/AdminPanel';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('messages');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      } else if (session) {
        setUser(session.user);
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
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderView = () => {
    // Si el usuario es administrador y está en la vista admin, mostrar el panel
    if (isAdmin && currentView === 'admin') {
      return <AdminPanel user={user!} />;
    }

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

  if (loading || adminLoading) {
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
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
