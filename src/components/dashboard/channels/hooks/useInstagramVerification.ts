import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, InstagramVerification, InstagramConfig, Channel } from '../types';
import { ChannelsService } from '../services/channelsService';
import { NotificationService } from '@/components/notifications';

export const useInstagramVerification = (user: User | null) => {
  const [igVerifications, setIgVerifications] = useState<Record<string, InstagramVerification>>({});
  const [isGeneratingCode, setIsGeneratingCode] = useState<Record<string, boolean>>({});
  const [verificationPolling, setVerificationPolling] = useState<Record<string, NodeJS.Timeout>>({});
  const [notificationsShown, setNotificationsShown] = useState<Set<string>>(new Set());
  const [verificationNotificationsShown, setVerificationNotificationsShown] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Cleanup polling timers on unmount
  useEffect(() => {
    return () => {
      Object.values(verificationPolling).forEach(timeout => {
        if (timeout) {
          clearInterval(timeout);
        }
      });
    };
  }, [verificationPolling]);

  // Clean up expired verification codes
  useEffect(() => {
    const cleanupExpired = () => {
      const now = new Date();
      setIgVerifications(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.entries(updated).forEach(([channelId, verification]) => {
          const expiresAt = new Date(verification.expires_at);
          if (now > expiresAt && verification.status === 'pending') {
            delete updated[channelId];
            hasChanges = true;

            // Stop polling for expired code
            const timeout = verificationPolling[channelId];
            if (timeout) {
              clearInterval(timeout);
              setVerificationPolling(prev => {
                const updatedPolling = { ...prev };
                delete updatedPolling[channelId];
                return updatedPolling;
              });
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    // Check for expired codes every 30 seconds
    const cleanupInterval = setInterval(cleanupExpired, 30000);
    
    return () => clearInterval(cleanupInterval);
  }, [verificationPolling]);

  // Check verification status by polling the channel configuration
  const checkVerificationStatus = useCallback(async (channelId: string) => {
    if (!user) return false;

    try {
      const isCompleted = await ChannelsService.checkVerificationStatus(channelId, user);
      
      if (isCompleted) {
        // Clear verification UI
        setIgVerifications(prev => {
          const updated = { ...prev };
          delete updated[channelId];
          return updated;
        });
        
        // Stop polling
        const timeout = verificationPolling[channelId];
        if (timeout) {
          clearInterval(timeout);
          setVerificationPolling(prev => {
            const updated = { ...prev };
            delete updated[channelId];
            return updated;
          });
        }
        
        // Crear notificación de verificación exitosa
        const notificationKey = `verification-success-${channelId}`;
        if (!verificationNotificationsShown.has(notificationKey) && user?.id) {
          NotificationService.createNotification(
            user.id,
            'instagram_verification',
            'Instagram verificado exitosamente',
            'Tu cuenta ya puede recibir mensajes automáticamente',
            {
              priority: 'high',
              metadata: {
                channel_id: channelId,
                verification_status: 'completed',
                channel_type: 'instagram'
              },
              action_url: '/dashboard/channels',
              action_label: 'Ver configuración'
            }
          ).catch(error => {
            console.error('Error creating verification success notification:', error);
          });
          
          setVerificationNotificationsShown(prev => new Set(prev).add(notificationKey));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }, [user, verificationPolling, verificationNotificationsShown]);

  // Start polling for verification completion
  const startVerificationPolling = useCallback((channelId: string) => {
    // Clear any existing polling for this channel
    const existingTimeout = verificationPolling[channelId];
    if (existingTimeout) {
      clearInterval(existingTimeout);
    }

    const pollInterval = setInterval(async () => {
      const isCompleted = await checkVerificationStatus(channelId);
      if (isCompleted) {
        // Verification completed
      }
    }, 3000); // Check every 3 seconds

    setVerificationPolling(prev => ({
      ...prev,
      [channelId]: pollInterval
    }));

    // Stop polling after 35 minutes (5 minutes past expiration)
    setTimeout(() => {
      clearInterval(pollInterval);
      setVerificationPolling(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
    }, 35 * 60 * 1000);
  }, [verificationPolling, checkVerificationStatus]);

  // Generate Instagram verification code
  const generateInstagramVerificationCode = useCallback(async (channelId: string) => {
    if (!user) {
      // Notificación desactivada - se manejará en el sistema central de notificaciones
      // toast({
      //   title: "Error",
      //   description: "Debes estar autenticado",
      //   variant: "destructive",
      // });
      console.error('Error: Usuario no autenticado');
      return;
    }

    setIsGeneratingCode(prev => ({ ...prev, [channelId]: true }));

    try {
      const verification = await ChannelsService.generateInstagramVerificationCode(channelId, user);

      setIgVerifications(prev => ({ 
        ...prev, 
        [channelId]: verification 
      }));

      // Start polling for completion
      startVerificationPolling(channelId);

      // Crear notificación de código generado
      NotificationService.createNotification(
        user.id,
        'instagram_verification',
        'Código de verificación generado',
        `Envía ${verification.verification_code} como mensaje en Instagram. El sistema detectará automáticamente cuando lo envíes.`,
        {
          priority: 'medium',
          metadata: {
            channel_id: channelId,
            verification_code: verification.verification_code,
            expires_at: verification.expires_at,
            channel_type: 'instagram'
          },
          action_url: '/dashboard/channels',
          action_label: 'Ver código'
        }
      ).catch(error => {
        console.error('Error creating code generation notification:', error);
      });

    } catch (error: unknown) {
      console.error('Error generating verification code:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar el código de verificación";
      
      // Crear notificación de error
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'error',
          'Error generando código de verificación',
          errorMessage,
          {
            priority: 'high',
            metadata: {
              channel_id: channelId,
              error_type: 'verification_code_generation_failed',
              error_message: errorMessage,
              channel_type: 'instagram'
            },
            action_url: '/dashboard/channels',
            action_label: 'Reintentar'
          }
        ).catch(notificationError => {
          console.error('Error creating verification error notification:', notificationError);
        });
      }
    } finally {
      setIsGeneratingCode(prev => ({ ...prev, [channelId]: false }));
    }
  }, [user, startVerificationPolling]);

  // Check if Instagram channel needs verification
  const instagramNeedsVerification = useCallback((config: InstagramConfig): boolean => {
    return ChannelsService.instagramNeedsVerification(config);
  }, []);

  // Get Instagram verification status
  const getInstagramVerificationStatus = useCallback((channelId: string, channels: Channel[]) => {
    const channel = channels.find(c => c.channel_type === 'instagram' && c.id === channelId);
    
    if (!channel || !channel.channel_config) {
      return { needsVerification: false, isVerified: false };
    }

    const config = channel.channel_config as InstagramConfig;
    const needsVerification = instagramNeedsVerification(config);
    const isVerified = Boolean(config?.verified_at);

    return { needsVerification, isVerified };
  }, [instagramNeedsVerification]);

  return {
    igVerifications,
    setIgVerifications,
    isGeneratingCode,
    verificationPolling,
    notificationsShown,
    setNotificationsShown,
    verificationNotificationsShown,
    setVerificationNotificationsShown,
    generateInstagramVerificationCode,
    instagramNeedsVerification,
    getInstagramVerificationStatus
  };
};
