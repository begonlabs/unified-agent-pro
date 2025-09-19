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
  const channel = channels.find(c => c.channel_type === channelType);
  
  if (!channel || !channel.channel_config) {
    return false;
  }

  // Verificación específica por tipo de canal
  switch (channelType) {
    case 'whatsapp': {
      const config = channel.channel_config as WhatsAppConfig;
      const hasPhoneNumberId = Boolean(config?.phone_number_id);
      const hasBusinessAccountId = Boolean(config?.business_account_id);
      const hasAccessToken = Boolean(config?.access_token);
      const isConnected = Boolean(channel.is_connected);
      return hasPhoneNumberId && hasBusinessAccountId && hasAccessToken && isConnected;
    }
    
    case 'facebook': {
      const config = channel.channel_config as FacebookConfig;
      const hasPageId = Boolean(config?.page_id);
      const hasPageToken = Boolean(config?.page_access_token);
      const hasUserToken = Boolean(config?.user_access_token);
      const isConnected = Boolean(channel.is_connected);
      return hasPageId && hasPageToken && hasUserToken && isConnected;
    }
    
    case 'instagram': {
      const config = channel.channel_config as InstagramConfig;
      const hasUsername = Boolean(config?.username);
      const hasAccessToken = Boolean(config?.access_token);
      const hasInstagramUserId = Boolean(config?.instagram_user_id);
      const hasAccountType = Boolean(config?.account_type);
      const isConnected = Boolean(channel.is_connected);
      const isTokenValid = config?.expires_at ? new Date(config.expires_at) > new Date() : false;
      
      return hasUsername && hasAccessToken && hasInstagramUserId && hasAccountType && 
             isConnected && isTokenValid;
    }
    
    default:
      return channel?.is_connected || false;
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

  const fetchChannels = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('�� Sidebar: Fetching channels status...');
      
      const { data } = await supabaseSelect(
        supabase
          .from('communication_channels')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
      );
      
      console.log('�� Sidebar: Channels fetched:', data?.length || 0);
      const channelsData = (data as Channel[]) || [];
      setChannels(channelsData);
      
      // Actualizar estado de cada canal usando la función helper
      setStatus({
        whatsapp: getChannelStatus(channelsData, 'whatsapp'),
        facebook: getChannelStatus(channelsData, 'facebook'),
        instagram: getChannelStatus(channelsData, 'instagram')
      });
      
    } catch (error: unknown) {
      console.error('❌ Sidebar: Error loading channels:', error);
      handleSupabaseError(error, "Error al cargar estado de canales");
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Solo depende de user.id

  useEffect(() => {
    if (user && !authLoading) {
      fetchChannels();
    }
  }, [user, authLoading, fetchChannels]);

  return {
    status,
    loading,
    refreshChannels: fetchChannels
  };
};