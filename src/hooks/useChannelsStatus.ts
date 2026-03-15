import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { useAuth } from '@/hooks/useAuth';

interface ChannelStatus {
  whatsapp: boolean;
  facebook: boolean;
  instagram: boolean;
}

interface WhatsAppConfig {
  phone_number: string;
  phone_number_id?: string;
  business_account_id?: string;
  access_token?: string;
  display_phone_number?: string;
  verified_name?: string;
  business_name?: string;
  account_review_status?: string;
  business_verification_status?: string;
  webhook_configured?: boolean;
  webhook_url?: string;
  connected_at?: string;
}

interface FacebookConfig {
  page_id: string;
  page_name: string;
  page_access_token: string;
  user_access_token: string;
  webhook_subscribed: boolean;
  connected_at: string;
}

interface InstagramConfig {
  username: string;
  instagram_user_id: string;
  instagram_business_account_id?: string;
  access_token: string;
  account_type: string;
  token_type: string;
  expires_at: string;
  connected_at: string;
  media_count?: number;
  webhook_subscribed?: boolean;
  verified_at?: string;
}

type ChannelConfig = WhatsAppConfig | FacebookConfig | InstagramConfig | null;

interface Channel {
  id: string;
  channel_type: string;
  channel_config: ChannelConfig;
  is_connected: boolean;
}

// Función helper para verificar estado de canal (fuera del hook para evitar dependencias)
const getChannelStatus = (channels: Channel[], channelType: string): boolean => {
  if (!Array.isArray(channels)) return false;

  switch (channelType) {
    case 'whatsapp':
      return channels.some(c => (c.channel_type === 'whatsapp' || c.channel_type === 'whatsapp_green_api') && c.is_connected);
    case 'facebook':
      return channels.some(c => c.channel_type === 'facebook' && c.is_connected);
    case 'instagram':
      return channels.some(c => (c.channel_type === 'instagram' || c.channel_type === 'instagram_legacy') && c.is_connected);
    default:
      return channels.some(c => c.channel_type === channelType && c.is_connected);
  }
};

export const useChannelsStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ChannelStatus>({
    whatsapp: false,
    facebook: false,
    instagram: false
  });
  const [disconnectedChannels, setDisconnectedChannels] = useState<Channel[]>([]);

  const fetchChannels = useCallback(async (silent: boolean = false) => {
    if (!user?.id) return;

    try {
      if (!silent) {
        setLoading(true);
      }
      // Fetching channels status

      const { data } = await supabaseSelect(
        supabase
          .from('communication_channels')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
      );

      // Channels fetched successfully
      let channelsData = (data as Channel[]) || [];

      // ACTIVO: Verificación proactiva de tokens de Meta
      const verificationPromises = channelsData.map(async (channel) => {
        if ((channel.channel_type === 'facebook' || channel.channel_type === 'instagram' || channel.channel_type === 'instagram_legacy') && channel.is_connected) {
          try {
            const config = channel.channel_config as Record<string, any>;
            // Try to find the page access token or user access token
            const token = config?.page_access_token || config?.access_token;
            
            if (token) {
              // Silently ping Meta Graph API to verify token validity
              const graphVersion = import.meta.env.VITE_META_GRAPH_VERSION || 'v24.0';
              const response = await fetch(`https://graph.facebook.com/${graphVersion}/me?access_token=${token}`);
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error(`❌ Token de Meta detectado como inválido para canal ${channel.id}:`, errorData);
                
                // Si el error es de autenticación (ej: token expirado o desautorizado)
                if (errorData.error && (errorData.error.code === 190 || errorData.error.type === 'OAuthException')) {
                  console.log(`🔌 Desconectando canal ${channel.id} en la base de datos debido a token expirado/inválido.`);
                  // Actualizar en base de datos
                  await supabase
                    .from('communication_channels')
                    .update({ is_connected: false })
                    .eq('id', channel.id);
                  
                  // Actualizar el estado local para reflejar la desconexión
                  return { ...channel, is_connected: false };
                }
              }
            }
          } catch (e) {
            console.error(`Error verificando token de meta para canal ${channel.id}:`, e);
          }
        }
        return channel;
      });

      // Wait for all verifications to complete
      if (verificationPromises.length > 0) {
        channelsData = await Promise.all(verificationPromises);
      }

      setChannels(channelsData);

      // Actualizar estado de cada canal usando la función helper
      setStatus({
        whatsapp: getChannelStatus(channelsData, 'whatsapp'),
        facebook: getChannelStatus(channelsData, 'facebook'),
        instagram: getChannelStatus(channelsData, 'instagram')
      });

      // Filter exactly which ones exist but are disconnected
      const disconnected = channelsData.filter(c => !c.is_connected);
      setDisconnectedChannels(disconnected);

    } catch (error: unknown) {
      console.error('Sidebar: Error loading channels:', error);
      handleSupabaseError(error, "Error al cargar estado de canales");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?.id]); // Solo depende de user.id

  useEffect(() => {
    if (user && !authLoading) {
      fetchChannels();

      // Suscribirse a notificaciones de desconexión en tiempo real (Backend reactive detection)
      const channel = supabase.channel('channel_notifications')
        .on('broadcast', { event: 'channel_disconnected' }, (payload) => {
          if (payload.payload.userId === user.id) {
            console.log('📡 Recibida notificación de desconexión por Realtime. Actualizando dashboard...');
            fetchChannels(true); // Refresco silencioso
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, authLoading, fetchChannels]);

  return {
    status,
    loading,
    channels,
    disconnectedChannels,
    refreshChannels: fetchChannels
  };
};