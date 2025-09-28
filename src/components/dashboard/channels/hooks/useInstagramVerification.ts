import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, InstagramVerification, InstagramConfig, Channel } from '../types';
import { ChannelsService } from '../services/channelsService';

export const useInstagramVerification = (user: User | null) => {
  const [igVerifications, setIgVerifications] = useState<Record<string, InstagramVerification>>({});
  const [isGeneratingCode, setIsGeneratingCode] = useState<Record<string, boolean>>({});
  const [verificationPolling, setVerificationPolling] = useState<Record<string, NodeJS.Timeout>>({});
  const [notificationsShown, setNotificationsShown] = useState<Set<string>>(new Set());
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
        
        toast({
          title: "Instagram verificado exitosamente",
          description: "Tu cuenta ya puede recibir mensajes automáticamente",
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }, [user, verificationPolling, toast]);

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
      toast({
        title: "Error",
        description: "Debes estar autenticado",
        variant: "destructive",
      });
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

      toast({
        title: "Código de verificación generado",
        description: `Envía ${verification.verification_code} como mensaje en Instagram. El sistema detectará automáticamente cuando lo envíes.`,
      });

    } catch (error: unknown) {
      console.error('Error generating verification code:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar el código de verificación";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(prev => ({ ...prev, [channelId]: false }));
    }
  }, [user, toast, startVerificationPolling]);

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
    generateInstagramVerificationCode,
    instagramNeedsVerification,
    getInstagramVerificationStatus
  };
};
