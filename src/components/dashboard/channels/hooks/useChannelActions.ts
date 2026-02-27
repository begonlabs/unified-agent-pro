import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, Channel } from '../types';
import { ChannelsService } from '../services/channelsService';
import { NotificationService } from '@/components/notifications';
import { EmailService } from '@/services/emailService';
import { getGreenApiHost } from '@/utils/greenApiUtils';
import { supabase } from '@/integrations/supabase/client';

export const useChannelActions = (user: User | null) => {
  const { toast } = useToast();

  // Función para desconectar un canal
  const handleDisconnectChannel = useCallback(async (channelId: string, channels: Channel[], setChannels: (channels: Channel[]) => void) => {
    try {
      if (!user?.id) {
        // Notificación desactivada - se manejará en el sistema central de notificaciones
        // toast({
        //   title: "Error",
        //   description: "Debes estar autenticado",
        //   variant: "destructive",
        // });
        console.error('Error: Usuario no autenticado');
        return;
      }

      // Confirmar desconexión
      const channel = channels.find(c => c.id === channelId);
      if (!channel) {
        // Notificación desactivada - se manejará en el sistema central de notificaciones
        // toast({
        //   title: "Error",
        //   description: "Canal no encontrado",
        //   variant: "destructive",
        // });
        console.error('Error: Canal no encontrado');
        return;
      }

      const channelName = channel.channel_type === 'whatsapp' || channel.channel_type === 'whatsapp_green_api' ? 'WhatsApp' :
        channel.channel_type === 'facebook' ? 'Facebook' :
          channel.channel_type === 'instagram' ? 'Instagram' : 'Canal';

      if (!confirm(`¿Estás seguro de que quieres desconectar ${channelName}? Esta acción eliminará la conexión permanentemente.`)) {
        return;
      }

      // Eliminar canal de la base de datos
      await ChannelsService.disconnectChannel(channelId, user);

      // Actualizar estado local
      const isGreenApi = channel.channel_type === 'whatsapp_green_api';
      if (isGreenApi) {
        setChannels(channels.map(c =>
          c.id === channelId ? { ...c, is_connected: false } : c
        ));
      } else {
        setChannels(channels.filter(c => c.id !== channelId));
      }

      // Crear notificación de desconexión exitosa
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'channel_disconnection',
          `${channelName} desconectado`,
          'La conexión ha sido eliminada exitosamente',
          {
            priority: 'medium',
            metadata: {
              channel_id: channelId,
              channel_type: channel.channel_type,
              channel_name: channelName
            },
            action_url: '/dashboard/channels',
            action_label: 'Ver configuración'
          }
        ).catch(error => {
          console.error('Error creating disconnection notification:', error);
        });

        // Enviar correo de desconexión
        EmailService.shouldSendEmail(user.id, 'channels').then(shouldSend => {
          if (shouldSend && user.email) {
            const template = EmailService.getTemplates().channelConnected(
              user.email.split('@')[0],
              `${channelName} Desconectado`,
              channel.channel_type
            );
            EmailService.sendEmail({
              to: user.email,
              template: {
                ...template,
                subject: `❌ ${channelName} Desconectado - OndAI`,
                html: template.html.replace('¡Canal Conectado!', 'Canal Desconectado').replace('conectado exitosamente', 'desconectado exitosamente')
              },
              priority: 'medium'
            }).catch(error => {
              console.error('Error sending disconnection email:', error);
            });
          }
        });
      }

    } catch (error: unknown) {
      console.error('Error disconnecting channel:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo desconectar el canal";

      // Crear notificación de error
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'error',
          'Error al desconectar canal',
          errorMessage,
          {
            priority: 'high',
            metadata: {
              channel_id: channelId,
              error_type: 'disconnection_failed',
              error_message: errorMessage
            },
            action_url: '/dashboard/channels',
            action_label: 'Reintentar'
          }
        ).catch(notificationError => {
          console.error('Error creating error notification:', notificationError);
        });
      }
    }
  }, [user]);

  // Función para eliminar permanentemente un canal (Hard Delete)
  const handleHardDeleteChannel = useCallback(async (channelId: string, channels: Channel[], setChannels: (channels: Channel[]) => void) => {
    try {
      if (!user?.id) {
        console.error('Error: Usuario no autenticado');
        return;
      }

      const channel = channels.find(c => c.id === channelId);
      const isGreenApi = channel?.channel_type === 'whatsapp_green_api';

      if (!confirm(`¿Estás SEGURO de que quieres BORRAR PERMANENTEMENTE esta instancia de WhatsApp? Esta acción no se puede deshacer y perderás el acceso a esta línea específica en Green API.${!isGreenApi ? ' NOTA: Este no es un canal de Green API.' : ''}`)) {
        return;
      }

      toast({
        title: "Eliminando...",
        description: "Borrando instancia de Green API y de tu cuenta.",
      });

      // Eliminar canal permanentemente
      await ChannelsService.disconnectChannel(channelId, user, true);

      // Actualizar estado local (eliminar totalmente de la lista)
      setChannels(channels.filter(c => c.id !== channelId));

      toast({
        title: "Instancia eliminada",
        description: "La instancia ha sido borrada permanentemente.",
      });

    } catch (error: unknown) {
      console.error('Error in hard delete:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar la instancia";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const handleClearAllWhatsAppChannels = useCallback(async (channels: Channel[], setChannels: (channels: Channel[]) => void) => {
    if (!confirm("⚠️ ¿Estás SEGURO de que quieres borrar TODAS tus instancias de WhatsApp? esto limpiará tanto Green API como tu base de datos local.")) return;

    try {
      toast({
        title: "Limpiando...",
        description: "Borrando todas las instancias de WhatsApp registrados.",
      });

      const waChannels = channels.filter(c => c.channel_type === 'whatsapp' || c.channel_type === 'whatsapp_green_api');

      for (const channel of waChannels) {
        try {
          await ChannelsService.disconnectChannel(channel.id, user, true);
        } catch (e) {
          console.error(`Error deleting channel ${channel.id}:`, e);
          // If it fails (maybe already gone), we still try to delete directly from DB if it was a green api one
          if (channel.channel_type === 'whatsapp_green_api') {
            await supabase.from('communication_channels').delete().eq('id', channel.id);
          }
        }
      }

      setChannels(channels.filter(c => c.channel_type !== 'whatsapp' && c.channel_type !== 'whatsapp_green_api'));

      toast({
        title: "Limpieza completada",
        description: "Todos los canales de WhatsApp han sido eliminados.",
      });

    } catch (error: any) {
      toast({
        title: "Error en la limpieza",
        description: error.message || "No se pudieron borrar todos los canales",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Función para probar webhook de Facebook
  const handleTestWebhook = useCallback(async (channelId: string) => {
    try {
      if (!user?.id) {
        // Notificación desactivada - se manejará en el sistema central de notificaciones
        // toast({
        //   title: "Error",
        //   description: "Debes estar autenticado",
        //   variant: "destructive",
        // });
        console.error('Error: Usuario no autenticado');
        return;
      }

      // Notificación desactivada - se manejará en el sistema central de notificaciones
      // toast({
      //   title: "Probando webhook...",
      //   description: "Enviando mensaje de prueba para verificar el procesamiento",
      // });

      await ChannelsService.testFacebookWebhook(channelId, user);

      // Crear notificación de éxito
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'webhook_test',
          'Webhook funcionando',
          'El webhook está activo y procesando mensajes correctamente',
          {
            priority: 'low',
            metadata: {
              channel_id: channelId,
              test_type: 'webhook_test',
              status: 'success'
            },
            action_url: '/dashboard/channels',
            action_label: 'Ver configuración'
          }
        ).catch(error => {
          console.error('Error creating webhook success notification:', error);
        });
      }

    } catch (error: unknown) {
      console.error('Error in Facebook integration test:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo completar el test";

      // Crear notificación de error
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'error',
          'Error en test de webhook',
          errorMessage,
          {
            priority: 'high',
            metadata: {
              channel_id: channelId,
              error_type: 'webhook_test_failed',
              error_message: errorMessage
            },
            action_url: '/dashboard/channels',
            action_label: 'Reintentar'
          }
        ).catch(notificationError => {
          console.error('Error creating webhook error notification:', notificationError);
        });
      }
    }
  }, [user]);

  return {
    handleDisconnectChannel,
    handleTestWebhook,
    handleHardDeleteChannel,
    handleClearAllWhatsAppChannels
  };
};
