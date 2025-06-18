
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useAdmin = (user: User | null) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      console.log('Checking admin role for user:', user?.id);
      
      if (!user) {
        console.log('No user provided');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // First, let's check if the user_roles table has the admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        console.log('Role query result:', { roleData, roleError });

        if (roleError) {
          console.error('Error checking role directly:', roleError);
          // Fallback to RPC function
          const { data: rpcData, error: rpcError } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });

          console.log('RPC function result:', { rpcData, rpcError });

          if (rpcError) {
            console.error('Error checking admin role via RPC:', rpcError);
            setIsAdmin(false);
          } else {
            setIsAdmin(rpcData || false);
          }
        } else {
          // If we found a role record, the user is admin
          setIsAdmin(!!roleData);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  console.log('useAdmin hook state:', { isAdmin, loading, userId: user?.id });

  return { isAdmin, loading };
};
