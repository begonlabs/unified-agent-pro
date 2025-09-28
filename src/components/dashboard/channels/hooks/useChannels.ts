import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { Channel, User } from '../types';
import { ChannelsService } from '../services/channelsService';

export const useChannels = (user: User | null) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchChannels = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await ChannelsService.fetchChannels(user);
      setChannels(data);
    } catch (error: unknown) {
      const errorInfo = ChannelsService.handleSupabaseError(error, "No se pudieron cargar los canales");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user, fetchChannels]);

  // Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      await fetchChannels();
    },
    'channels'
  );

  const getChannelStatus = useCallback((channelType: string) => {
    return ChannelsService.getChannelStatus(channelType, channels);
  }, [channels]);

  return {
    channels,
    setChannels,
    loading,
    fetchChannels,
    getChannelStatus
  };
};
