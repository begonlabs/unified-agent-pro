import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { Profile, ProfileFormData, NotificationSettings, User } from '../types';
import { ProfileService } from '../services/profileService';

export const useProfile = (user: User | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await ProfileService.fetchProfile(user.id);
      setProfile(data);
    } catch (error: unknown) {
      const errorInfo = ProfileService.handleSupabaseError?.(error, "No se pudo cargar el perfil") || {
        title: "Error",
        description: "No se pudo cargar el perfil"
      };
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchProfile();

    // Subscribe to realtime changes
    if (!user?.id) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Profile updated via realtime:', payload);
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile, user?.id]);

  // 🔄 Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 ProfileView: Refreshing profile data');
      if (user) {
        await fetchProfile();
      }
    },
    'profile'
  );

  return {
    profile,
    loading,
    fetchProfile,
    setProfile
  };
};
