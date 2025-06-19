
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminPanel from '@/components/admin/AdminPanel';

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin(user);

  console.log('AdminDashboard render:', { 
    user: user?.email, 
    isAdmin, 
    adminLoading, 
    loading,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Admin dashboard session:', session?.user?.email);
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
        return;
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Admin dashboard auth state changed:', event, session?.user?.email);
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

  // Mostrar loading mientras se cargan los datos
  if (loading || adminLoading) {
    console.log('Showing loading spinner', { loading, adminLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Si no hay usuario, mostrar loading (el useEffect se encarga de redirigir)
  if (!user) {
    console.log('No user found');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Si NO es admin, mostrar error y redirigir SOLO UNA VEZ
  if (isAdmin === false) {
    console.log('User is NOT admin, showing error and redirecting');
    toast({
      title: "Acceso denegado",
      description: "No tienes permisos para acceder al panel de administración.",
      variant: "destructive",
    });
    navigate('/dashboard');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Si ES admin, mostrar el panel
  if (isAdmin === true) {
    console.log('User IS admin, showing admin panel');
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar onSignOut={handleSignOut} />
        <main className="flex-1 overflow-hidden">
          <AdminPanel user={user} />
        </main>
      </div>
    );
  }

  // Caso por defecto: mostrar loading
  console.log('Default case - showing loading');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>
  );
};

export default AdminDashboard;
