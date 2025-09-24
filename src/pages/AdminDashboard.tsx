
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import ResponsiveAdminSidebar from '@/components/admin/ResponsiveAdminSidebar';
import ClientManagement from '@/components/admin/ClientManagement';
import GeneralStats from '@/components/admin/GeneralStats';
import ClientStats from '@/components/admin/ClientStats';
import AdminSettings from '@/components/admin/AdminSettings';
import SupportMessages from '@/components/admin/SupportMessages';

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log('AdminDashboard state:', { 
    user: user?.email, 
    isAdmin, 
    loading,
    activeTab,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('Checking admin access...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Admin dashboard session:', session?.user?.email);
        
        if (!session) {
          console.log('No session, redirecting to admin auth');
          navigate('/admin/auth');
          return;
        }

        setUser(session.user);

        // Verificar rol de admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('Admin role check:', { roleData, roleError });

        if (roleError) {
          console.error('Error checking admin role:', roleError);
          toast({
            title: "Error de verificación",
            description: "Error al verificar permisos de administrador.",
            variant: "destructive",
          });
          navigate('/admin/auth');
          return;
        }

        if (!roleData) {
          console.log('User is not admin, redirecting to admin auth');
          await supabase.auth.signOut();
          toast({
            title: "Acceso denegado",
            description: "Solo administradores pueden acceder a este panel.",
            variant: "destructive",
          });
          navigate('/admin/auth');
          return;
        }

        console.log('User is admin, access granted');
        setIsAdmin(true);
      } catch (error) {
        console.error('Error in admin access check:', error);
        navigate('/admin/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Admin dashboard auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, redirecting to admin auth');
        navigate('/admin/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      toast({
        title: "Cerrando sesión de administrador...",
        description: "Redirigiendo...",
      });
      
      // Usar logout robusto
      const { robustSignOut } = await import('@/lib/utils');
      await robustSignOut();
      
      // Redirigir específicamente a admin auth
      setTimeout(() => {
        window.location.href = '/admin/auth';
      }, 500);
      
    } catch (error: unknown) {
      console.error('Error during admin sign out:', error);
      toast({
        title: "Error al cerrar sesión",
        description: "Redirigiendo de todas formas...",
        variant: "destructive",
      });
      
      // Forzar redirección incluso si hay error
      setTimeout(() => {
        window.location.href = '/admin/auth';
      }, 1000);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientManagement />;
      case 'general-stats':
        return <GeneralStats />;
      case 'client-stats':
        return <ClientStats />;
      case 'support':
        return <SupportMessages />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <ClientManagement />;
    }
  };

  const getTabTitle = () => {
    const titles = {
      'clients': 'Gestión de Clientes',
      'general-stats': 'Estadísticas Generales',
      'client-stats': 'Stats por Cliente',
      'support': 'Gestión de Soporte',
      'settings': 'Configuración'
    };
    return titles[activeTab as keyof typeof titles] || 'Panel Admin';
  };

  // Mostrar loading mientras se verifican permisos
  if (loading || !user || isAdmin !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ResponsiveAdminSidebar 
        onSignOut={handleSignOut} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 overflow-hidden lg:ml-0">
        <div className="h-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 mt-12 lg:mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{getTabTitle()}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Administrando como: <span className="font-medium">{user.email}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-6 h-[calc(100vh-80px)] overflow-y-auto">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
