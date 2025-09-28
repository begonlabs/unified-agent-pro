import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, Channel } from '../types';
import { ChannelsService } from '../services/channelsService';

export const useChannelActions = (user: User | null) => {
  const { toast } = useToast();

  // Función para desconectar un canal
  const handleDisconnectChannel = useCallback(async (channelId: string, channels: Channel[], setChannels: (channels: Channel[]) => void) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Debes estar autenticado",
          variant: "destructive",
        });
        return;
      }

      // Confirmar desconexión
      const channel = channels.find(c => c.id === channelId);
      if (!channel) {
        toast({
          title: "Error",
          description: "Canal no encontrado",
          variant: "destructive",
        });
        return;
      }

      const channelName = channel.channel_type === 'whatsapp' ? 'WhatsApp' :
                         channel.channel_type === 'facebook' ? 'Facebook' :
                         channel.channel_type === 'instagram' ? 'Instagram' : 'Canal';

      if (!confirm(`¿Estás seguro de que quieres desconectar ${channelName}? Esta acción eliminará la conexión permanentemente.`)) {
        return;
      }

      // Eliminar canal de la base de datos
      await ChannelsService.disconnectChannel(channelId, user);

      // Actualizar estado local
      setChannels(channels.filter(c => c.id !== channelId));

      toast({
        title: `${channelName} desconectado`,
        description: "La conexión ha sido eliminada exitosamente",
      });

    } catch (error: unknown) {
      console.error('Error disconnecting channel:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo desconectar el canal";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Función para probar webhook de Facebook
  const handleTestWebhook = useCallback(async (channelId: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Debes estar autenticado",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Probando webhook...",
        description: "Enviando mensaje de prueba para verificar el procesamiento",
      });

      await ChannelsService.testFacebookWebhook(channelId, user);

      toast({
        title: "Webhook funcionando",
        description: "El webhook está activo y procesando mensajes correctamente",
      });

    } catch (error: unknown) {
      console.error('Error in Facebook integration test:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo completar el test";
      toast({
        title: "Error en test",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return {
    handleDisconnectChannel,
    handleTestWebhook
  };
};
