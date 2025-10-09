import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, Channel } from '../types';
import { ChannelsService } from '../services/channelsService';
import { NotificationService } from '@/components/notifications';
import { EmailService } from '@/services/emailService';

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
    handleTestWebhook
  };
};
