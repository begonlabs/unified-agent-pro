import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseInsert, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, Facebook, Instagram, Settings, CheckCircle, AlertCircle, MessageSquare, Clock, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Declaración global para Facebook SDK
// Facebook SDK types
interface FacebookSDK {
  init: (config: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id?: string;
      response_type?: string;
      override_default_response_type?: boolean;
      extras?: Record<string, unknown>;
    }
  ) => void;
}

interface FacebookLoginResponse {
  status: string;
  code?: string;
  authResponse?: {
    code?: string;
    accessToken?: string;
  };
}

declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

type ChannelType = 'whatsapp' | 'facebook' | 'instagram' | string;

interface WhatsAppConfig {
  phone_number: string;
  // Nueva estructura de WhatsApp Business API
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
  instagram_business_account_id?: string; // NEW: Business Account ID for messaging
  access_token: string;
  account_type: string;
  token_type: string;
  expires_at: string;
  connected_at: string;
  media_count?: number;
  webhook_subscribed?: boolean;
  verified_at?: string; // NEW: When verification was completed
}

interface InstagramVerification {
  id: string;
  verification_code: string;
  status: 'pending' | 'completed' | 'expired';
  expires_at: string;
}

// Hook para countdown timer
const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds, isExpired: false });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

// Componente para mostrar código de verificación con timer
const VerificationCodeDisplay = ({ 
  verification, 
  onCopy, 
  isPolling = false 
}: { 
  verification: InstagramVerification;
  onCopy: (code: string) => void;
  isPolling?: boolean;
}) => {
  const countdown = useCountdown(verification.expires_at);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono bg-white px-3 py-2 rounded-lg border-2 border-yellow-300 font-bold">
            {verification.verification_code}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onCopy(verification.verification_code)}
            className="border-yellow-300 hover:bg-yellow-50"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
        </div>
        
        {isPolling && (
          <div className="flex items-center gap-2 text-green-600">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium">Detectando mensaje...</span>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-yellow-800 text-sm">
            {countdown.isExpired ? "Código expirado" : `Tiempo restante: ${countdown.minutes}:${countdown.seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-yellow-700">
            <strong>📱 Instrucciones:</strong> Envía exactamente este código como un mensaje desde tu cuenta de Instagram.
          </p>
          <p className="text-xs text-yellow-700">
            <strong>🤖 Detección automática:</strong> El sistema verificará automáticamente cuando reciba el mensaje.
          </p>
          {isPolling && (
            <p className="text-xs text-green-700 font-medium">
              ⚡ Sistema en espera - Envía el mensaje ahora para completar la verificación
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

type ChannelConfig = WhatsAppConfig | FacebookConfig | InstagramConfig | null;

interface Channel {
  id: string;
  channel_type: ChannelType;
  channel_config: ChannelConfig;
  is_connected: boolean;
}

const ChannelsView = () => {
  const { user, loading: authLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showWebhookMonitor, setShowWebhookMonitor] = useState(false);
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [igVerifications, setIgVerifications] = useState<Record<string, InstagramVerification>>({});
  const [isGeneratingCode, setIsGeneratingCode] = useState<Record<string, boolean>>({});
  const [verificationPolling, setVerificationPolling] = useState<Record<string, NodeJS.Timeout>>({});
  const { toast } = useToast();

  // Función para cargar Facebook SDK
  const loadFacebookSDK = () => {
    return new Promise<void>((resolve) => {
      if (window.FB) {
        resolve();
        return;
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_META_APP_ID || '728339836340255',
          cookie: true,
          xfbml: true,
          version: import.meta.env.VITE_META_GRAPH_VERSION || 'v20.0'
        });
        console.log('Facebook SDK initialized for WhatsApp Embedded Signup');
        resolve();
      };

      // Load Facebook SDK
      (function(d, s, id) {
        const fjs = d.getElementsByTagName(s)[0] as HTMLElement;
        if (d.getElementById(id)) return;
        const js = d.createElement(s) as HTMLScriptElement; js.id = id;
        js.src = "https://connect.facebook.net/es_ES/sdk.js";
        if (fjs && fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk'));
    });
  };

  const fetchChannels = useCallback(async () => {
    try {
      if (user && user.id) {
        console.log('🔄 Fetching channels for user:', user.id);
        
        const { data } = await supabaseSelect(
          supabase
            .from('communication_channels')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }) // Show older channels first (Instagram is usually first)
        );
        
        console.log('📊 Channels fetched:', data?.length || 0);
        
        // Debug: Mostrar información detallada de los canales
        if (data && data.length > 0) {
          console.log('📊 Channel Status Debug:');
          data.forEach(channel => {
            console.log(`${channel.channel_type.toUpperCase()} Channel:`, {
              id: channel.id,
              is_connected: channel.is_connected,
              config: channel.channel_config,
              has_config: Boolean(channel.channel_config),
              config_keys: channel.channel_config ? Object.keys(channel.channel_config) : [],
              created_at: channel.created_at,
              updated_at: channel.updated_at
            });

            // Extra debug for Instagram
            if (channel.channel_type === 'instagram' && channel.channel_config) {
              const igConfig = channel.channel_config as InstagramConfig;
              console.log(`📱 Instagram Detailed Debug:`, {
                username: igConfig.username,
                instagram_user_id: igConfig.instagram_user_id,
                instagram_business_account_id: igConfig.instagram_business_account_id,
                account_type: igConfig.account_type,
                verified_at: igConfig.verified_at,
                expires_at: igConfig.expires_at,
                token_valid: igConfig.expires_at ? new Date(igConfig.expires_at) > new Date() : false,
                ids_match: igConfig.instagram_user_id === igConfig.instagram_business_account_id,
                needs_verification: igConfig.instagram_user_id === igConfig.instagram_business_account_id || !igConfig.instagram_business_account_id
              });
            }
          });
        }
        
        // Verificar estado de webhook para canales de Facebook
        if (data) {
          for (const channel of data) {
            if (channel.channel_type === 'facebook' && channel.channel_config?.webhook_subscribed) {
              try {
                const webhookUrl = `${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/meta-webhook`;
                const response = await fetch(webhookUrl, { method: 'HEAD' });
                if (response.ok) {
                  console.log('✅ Webhook is accessible for channel:', channel.id);
                } else {
                  console.warn('⚠️ Webhook not accessible for channel:', channel.id);
                }
              } catch (error) {
                console.warn('⚠️ Could not verify webhook for channel:', channel.id, error);
              }
            }
          }
        }
        
        setChannels((data as Channel[]) || []);
        
        // Log final summary
        const summary = {
          total_channels: data?.length || 0,
          whatsapp_connected: data?.some(c => c.channel_type === 'whatsapp' && c.is_connected) || false,
          facebook_connected: data?.some(c => c.channel_type === 'facebook' && c.is_connected) || false,
          instagram_connected: data?.some(c => c.channel_type === 'instagram' && c.is_connected) || false,
          instagram_needs_verification: data?.filter(c => 
            c.channel_type === 'instagram' && 
            c.is_connected && 
            c.channel_config && 
            ((c.channel_config as InstagramConfig).instagram_user_id === (c.channel_config as InstagramConfig).instagram_business_account_id)
          ).length || 0
        };
        
        console.log('🎯 Channels Summary:', summary);
      }
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudieron cargar los canales");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchChannels();
    }
  }, [user, authLoading, fetchChannels]);

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
            console.log('🧹 Cleaning up expired verification:', verification.verification_code);
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

  // Check if Instagram channel needs verification
  const instagramNeedsVerification = useCallback((config: InstagramConfig): boolean => {
    // When instagram_user_id equals instagram_business_account_id, verification is needed
    // This happens because Instagram returns the same ID for both, but we need the correct business account ID
    return config.instagram_user_id === config.instagram_business_account_id ||
           !config.instagram_business_account_id;
  }, []);

  const getChannelStatus = useCallback((channelType: string) => {
    const channel = channels.find(c => c.channel_type === channelType);
    
    if (!channel || !channel.channel_config) {
      console.log(`${channelType}: No channel or config found`);
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
        const status = hasPhoneNumberId && hasBusinessAccountId && hasAccessToken && isConnected;
        
        console.log(`WHATSAPP Status:`, {
          hasPhoneNumberId,
          hasBusinessAccountId,
          hasAccessToken: hasAccessToken ? 'Yes' : 'No',
          isConnected,
          displayPhoneNumber: config?.display_phone_number,
          businessName: config?.business_name,
          webhookConfigured: config?.webhook_configured,
          finalStatus: status
        });
        
        return status;
      }
      
      case 'facebook': {
        const config = channel.channel_config as FacebookConfig;
        const hasPageId = Boolean(config?.page_id);
        const hasPageToken = Boolean(config?.page_access_token);
        const hasUserToken = Boolean(config?.user_access_token);
        const isConnected = Boolean(channel.is_connected);
        const status = hasPageId && hasPageToken && hasUserToken && isConnected;
        
        console.log(`FACEBOOK Status:`, {
          hasPageId,
          hasPageToken: hasPageToken ? 'Yes' : 'No',
          hasUserToken: hasUserToken ? 'Yes' : 'No',
          isConnected,
          pageName: config?.page_name,
          finalStatus: status
        });
        
        return status;
      }
      
      case 'instagram': {
        const config = channel.channel_config as InstagramConfig;
        const hasUsername = Boolean(config?.username);
        const hasAccessToken = Boolean(config?.access_token);
        const hasInstagramUserId = Boolean(config?.instagram_user_id);
        const hasAccountType = Boolean(config?.account_type);
        const isConnected = Boolean(channel.is_connected);
        const isTokenValid = config?.expires_at ? new Date(config.expires_at) > new Date() : false;
        
        // 🔥 FIXED: Instagram is CONNECTED if it has basic OAuth data (separate from verification)
        // Verification is a separate process for messaging functionality
        const status = hasUsername && hasAccessToken && hasInstagramUserId && hasAccountType && 
                      isConnected && isTokenValid;
        
        console.log(`📱 INSTAGRAM Connection Status:`, {
          hasUsername,
          hasAccessToken: hasAccessToken ? 'Yes' : 'No',
          hasInstagramUserId,
          hasAccountType,
          isConnected,
          isTokenValid,
          username: config?.username,
          accountType: config?.account_type,
          expiresAt: config?.expires_at,
          instagram_user_id: config?.instagram_user_id,
          instagram_business_account_id: config?.instagram_business_account_id,
          finalStatus: status,
          channelId: channel.id
        });
        
        return status;
      }
      
      default:
        return channel?.is_connected || false;
    }
  }, [channels]);

  // Auto-detect Instagram channels that need verification on load
  useEffect(() => {
    if (channels.length > 0 && user) {
      console.log('🔍 Auto-detecting Instagram verification needs...');
      
      // Find Instagram channels that are connected but need verification
      const instagramChannels = channels.filter(c => c.channel_type === 'instagram');
      
      if (instagramChannels.length > 0) {
        console.log(`📱 Found ${instagramChannels.length} Instagram channel(s), checking verification status...`);
      }
      
      instagramChannels.forEach(channel => {
        const config = channel.channel_config as InstagramConfig;
        const needsVerification = instagramNeedsVerification(config);
        const hasExistingVerification = igVerifications[channel.id];
        const isConnected = getChannelStatus('instagram');
        
        console.log(`📋 Instagram channel ${channel.id} (@${config?.username}) verification check:`, {
          isConnected,
          needsVerification,
          hasExistingVerification,
          instagram_user_id: config?.instagram_user_id,
          instagram_business_account_id: config?.instagram_business_account_id,
          verified_at: config?.verified_at,
          idsMatch: config?.instagram_user_id === config?.instagram_business_account_id
        });
        
        // Only show notification for connected Instagram that needs verification
        if (isConnected && needsVerification && !hasExistingVerification && !config?.verified_at) {
          console.log('🎯 Instagram channel is connected but needs verification, showing notification');
          
          setTimeout(() => {
            toast({
              title: "📱 Instagram detectado - Verificación requerida",
              description: `@${config?.username} está conectado pero necesita verificación para recibir mensajes automáticamente.`,
            });
          }, 1000); // Delay to avoid spamming notifications on page load
        } else if (isConnected && !needsVerification) {
          console.log('✅ Instagram channel is fully verified and ready');
        } else if (!isConnected) {
          console.log('🔌 Instagram channel not connected yet');
        }
      });
    }
  }, [channels, user, igVerifications, toast, getChannelStatus, instagramNeedsVerification]);

  // Check verification status by polling the channel configuration
  const checkVerificationStatus = async (channelId: string) => {
    try {
      const { data: channel } = await supabase
        .from('communication_channels')
        .select('channel_config, updated_at')
        .eq('id', channelId)
        .eq('user_id', user!.id)
        .single();

      if (channel) {
        const config = channel.channel_config as unknown as InstagramConfig;
        const needsVerification = instagramNeedsVerification(config);
        
        // If verification is complete, update UI
        if (!needsVerification && config.verified_at) {
          console.log('✅ Instagram verification completed for channel:', channelId);
          
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
          
          // Refresh channels to show updated status
          await fetchChannels();
          
          toast({
            title: "🎉 Instagram verificado exitosamente",
            description: `Tu cuenta @${config.username} ya puede recibir mensajes automáticamente`,
          });
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  };

  // Start polling for verification completion
  const startVerificationPolling = (channelId: string) => {
    // Clear any existing polling for this channel
    const existingTimeout = verificationPolling[channelId];
    if (existingTimeout) {
      clearInterval(existingTimeout);
    }

    console.log('🔄 Starting verification polling for channel:', channelId);
    
    const pollInterval = setInterval(async () => {
      const isCompleted = await checkVerificationStatus(channelId);
      if (isCompleted) {
        console.log('✅ Verification polling completed for channel:', channelId);
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
      console.log('⏰ Verification polling timeout for channel:', channelId);
    }, 35 * 60 * 1000);
  };

  // Generate Instagram verification code
  const generateInstagramVerificationCode = async (channelId: string) => {
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
      console.log('🔧 Generating Instagram verification code for channel:', channelId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/generate-instagram-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ 
          channel_id: channelId 
        })
      });

      const result = await response.json();

      if (result.success) {
        const verification: InstagramVerification = {
          id: `${channelId}_${Date.now()}`,
          verification_code: result.verification_code,
          status: 'pending',
          expires_at: result.expires_at
        };

        setIgVerifications(prev => ({ 
          ...prev, 
          [channelId]: verification 
        }));

        // Start polling for completion
        startVerificationPolling(channelId);

        toast({
          title: "🎯 Código de verificación generado",
          description: `Envía ${result.verification_code} como mensaje en Instagram. El sistema detectará automáticamente cuando lo envíes.`,
        });

        console.log('✅ Verification code generated and polling started:', result.verification_code);
      } else {
        throw new Error(result.error || 'Error generando código de verificación');
      }

    } catch (error: unknown) {
      console.error('❌ Error generating verification code:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar el código de verificación";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(prev => ({ ...prev, [channelId]: false }));
    }
  };

  // Check for success parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    
    if (successParam === 'true') {
      setTimeout(() => {
        fetchChannels();
      }, 1000);
      
      const pageName = urlParams.get('page_name');
      const businessName = urlParams.get('business_name');
      const phoneNumber = urlParams.get('phone_number');
      const channel = urlParams.get('channel');
      
      if (channel === 'whatsapp' && businessName) {
        toast({
          title: "WhatsApp conectado exitosamente",
          description: `Empresa: ${businessName}${phoneNumber ? ` - ${phoneNumber}` : ''}`,
        });
      } else if (pageName && channel) {
        toast({
          title: "Canal reconectado exitosamente",
          description: `${channel === 'facebook' ? 'Facebook' : 'Canal'} actualizado: ${pageName}`,
        });
      }
      
      // Limpiar URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchChannels, toast]);

  // Función separada para detectar si Instagram necesita verificación (pero ya está conectado)
  const getInstagramVerificationStatus = (channelId: string) => {
    const channel = channels.find(c => c.channel_type === 'instagram' && c.id === channelId);
    
    if (!channel || !channel.channel_config) {
      return { needsVerification: false, isVerified: false };
    }

    const config = channel.channel_config as InstagramConfig;
    const needsVerification = instagramNeedsVerification(config);
    const isVerified = Boolean(config?.verified_at);

    console.log(`🔍 Instagram Verification Status for channel ${channelId}:`, {
      needsVerification,
      isVerified,
      verified_at: config?.verified_at,
      instagram_user_id: config?.instagram_user_id,
      instagram_business_account_id: config?.instagram_business_account_id,
      idsMatch: config?.instagram_user_id === config?.instagram_business_account_id
    });

    return { needsVerification, isVerified };
  };

  // Función para manejar la respuesta de WhatsApp OAuth
  const handleWhatsAppResponse = async (response: FacebookLoginResponse, expectedState: string) => {
    console.log('WhatsApp OAuth response:', response);

    try {
      if (response.status === 'connected') {
        toast({
          title: "Procesando conexión WhatsApp",
          description: "Configurando automáticamente tu cuenta...",
        });

        // Get authorization code
        let authCode = response.code || response.authResponse?.code;
        
        if (!authCode) {
          // Fallback to access token if no code
          authCode = response.authResponse?.accessToken;
        }
        
        if (!authCode) {
          throw new Error('No se recibió código de autorización de Facebook');
        }
        
        console.log('Got authorization code:', authCode.substring(0, 20) + '...');
        
        // Send to backend
        await processWhatsAppAuth(authCode, expectedState);
        
      } else if (response.status === 'not_authorized') {
        throw new Error('Usuario no autorizó la aplicación WhatsApp');
      } else {
        console.log('Facebook response details:', response);
        throw new Error('Error en la autenticación con Facebook para WhatsApp');
      }
    } catch (error: unknown) {
      console.error('Error in WhatsApp OAuth:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error conectando WhatsApp",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnectingWhatsApp(false);
    }
  };

  // Función para procesar la autorización de WhatsApp
  const processWhatsAppAuth = async (code: string, state: string) => {
    try {
      console.log('Sending authorization code to backend...');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/whatsapp-embedded-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: state,
          userId: user!.id
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        toast({
          title: "WhatsApp conectado exitosamente!",
          description: `Empresa: ${result.data.businessName} - Teléfono: ${result.data.phoneNumber}`,
        });
        
        console.log('WhatsApp connected successfully:', result.data);
        
        // Refresh channels to show the new connection
        await fetchChannels();
        
      } else {
        throw new Error(result.error || 'Error desconocido al conectar WhatsApp');
      }

    } catch (error: unknown) {
      console.error('Error processing WhatsApp authorization:', error);
      throw error;
    }
  };

  // FUNCIÓN ACTUALIZADA para WhatsApp Login con Configuration ID
  const handleWhatsAppLogin = async () => {
    try {
      console.log('Starting WhatsApp Embedded Signup with Configuration ID...');
      
      if (!user) {
        console.error('Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar WhatsApp',
          variant: 'destructive',
        });
        return;
      }

      setIsConnectingWhatsApp(true);

      // Load Facebook SDK
      await loadFacebookSDK();

      // State parameter for callback
      const state = JSON.stringify({
        user_id: user.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2)
      });

      console.log('Starting Embedded Signup with Configuration ID: 789657450267769');

      toast({
        title: "Conectando WhatsApp Business",
        description: "Abriendo ventana de autorización de Meta...",
      });

      // Use Facebook Embedded Signup with your Configuration ID
      window.FB.login((response: FacebookLoginResponse) => {
        console.log('Facebook Embedded Signup response:', response);
        handleWhatsAppResponse(response, state);
      }, {
        config_id: '789657450267769', // Tu Configuration ID real
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup_type: 'BUSINESS_INTEGRATION',
          state: state
        }
      });

    } catch (error: unknown) {
      console.error('Error in WhatsApp Embedded Signup:', error);
      setIsConnectingWhatsApp(false);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con WhatsApp Business',
        variant: 'destructive',
      });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      console.log('Iniciando proceso de login de Facebook...');
      
      if (!user) {
        console.error('Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Facebook',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Usuario autenticado:', user.id);

      const META_APP_ID = import.meta.env.VITE_META_APP_ID || '728339836340255';
      const META_GRAPH_VERSION = import.meta.env.VITE_META_GRAPH_VERSION || 'v23.0';
      const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

      const redirectUri = `${EDGE_BASE_URL}/functions/v1/meta-oauth`;
      const scope = [
        'pages_show_list',
        'pages_manage_metadata',
        'pages_messaging',
      ].join(',');

      console.log('User object completo:', user);
      console.log('User ID type:', typeof user.id);
      console.log('User ID value:', user.id);
      
      const state = encodeURIComponent(JSON.stringify({ user_id: user.id }));
      const oauthUrl = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

      console.log('OAuth URL construida:', oauthUrl);
      console.log('User ID:', user.id);
      console.log('State parameter:', state);

      window.location.href = oauthUrl;
    } catch (error: unknown) {
      console.error('Error building Facebook OAuth URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Facebook',
        variant: 'destructive',
      });
    }
  };

  const handleInstagramLogin = async () => {
    try {
      console.log('Iniciando proceso de login de Instagram...');
      
      if (!user) {
        console.error('Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Instagram',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Usuario autenticado:', user.id);

      const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_BASIC_APP_ID || '1215743729877419';
      const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

      const redirectUri = `${EDGE_BASE_URL}/functions/v1/instagram-oauth`;
      
      const scope = [
        'instagram_business_basic',
        'instagram_business_manage_messages', 
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights'
      ].join(',');

      const state = encodeURIComponent(JSON.stringify({ 
        user_id: user.id
      }));

      const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?` +
        `client_id=${INSTAGRAM_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${state}`;

      console.log('Instagram OAuth URL construida:', instagramAuthUrl);
      console.log('User ID:', user.id);
      console.log('Client ID:', INSTAGRAM_CLIENT_ID);
      console.log('Scopes:', scope);
      
      window.location.href = instagramAuthUrl;

    } catch (error: unknown) {
      console.error('Error building Instagram OAuth URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Instagram',
        variant: 'destructive',
      });
    }
  };

  const handleTestWebhook = async (channelId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({
          title: "Error",
          description: "Debes estar autenticado",
          variant: "destructive",
        });
        return;
      }

      const { data: channel } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('id', channelId)
        .eq('user_id', user.id)
        .single();

      if (!channel) {
        toast({
          title: "Error",
          description: "Canal no encontrado",
          variant: "destructive",
        });
        return;
      }

      if (channel.channel_type !== 'facebook') {
        toast({
          title: "Test no disponible",
          description: "El test de webhook solo está disponible para canales de Facebook",
          variant: "destructive",
        });
        return;
      }

      const config = channel.channel_config as unknown as FacebookConfig;
      const pageAccessToken = config.page_access_token;
      const pageId = config.page_id;

      if (!pageAccessToken) {
        toast({
          title: "Error",
          description: "Token de acceso no encontrado",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Probando webhook...",
        description: "Enviando mensaje de prueba para verificar el procesamiento",
      });

      console.log('Testing webhook endpoint...');
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/meta-webhook`;
      
      try {
        const webhookTest = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            object: 'page',
            entry: [{
              id: pageId,
              time: Date.now(),
              messaging: [{
                sender: { id: 'test_user' },
                recipient: { id: pageId },
                timestamp: Date.now(),
                message: {
                  text: 'Test message from OndAI dashboard'
                }
              }]
            }]
          })
        });

        if (webhookTest.ok) {
          console.log('Webhook test passed');
        } else {
          console.warn('Webhook test failed:', webhookTest.status);
        }
      } catch (webhookError) {
        console.warn('Webhook test error:', webhookError);
      }

      console.log('Testing webhook with test message...');
      
      const testMessage = `Test desde OndAI - ${new Date().toLocaleTimeString()}`;
      
      const webhookTestMessage = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          object: 'page',
          entry: [{
            id: pageId,
            time: Date.now(),
            messaging: [{
              sender: { id: 'test_user_123' },
              recipient: { id: pageId },
              timestamp: Date.now(),
              message: {
                text: testMessage,
                mid: 'test_message_' + Date.now()
              }
            }]
          }]
        })
      });

      if (webhookTestMessage.ok) {
        toast({
          title: "Webhook funcionando",
          description: "El webhook está activo y procesando mensajes correctamente",
        });
        
        console.log('Webhook test results:', {
          webhook_accessible: true,
          webhook_test_message: true,
          page_id: pageId,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorData = await webhookTestMessage.text();
        console.error('Webhook test failed:', errorData);
        
        toast({
          title: "Problema en webhook",
          description: "El webhook es accesible, pero hay problemas al procesar mensajes",
          variant: "destructive",
        });
      }

    } catch (error: unknown) {
      console.error('Error in Facebook integration test:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo completar el test";
      toast({
        title: "Error en test",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  interface ChannelCardProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    connected: boolean;
    description: string;
    children: React.ReactNode;
  }

  const ChannelCard = ({ 
    title, 
    icon: Icon, 
    color, 
    connected, 
    description,
    children 
  }: ChannelCardProps) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant={connected ? "default" : "secondary"} className="flex items-center gap-1">
            {connected ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No autenticado</h2>
            <p className="text-muted-foreground mb-4">Debes iniciar sesión para acceder a esta página</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Ir a Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Canales</h1>
          <p className="text-muted-foreground mt-1">
            Conecta tus redes sociales de manera sencilla
            {channels.length > 0 && (
              <span className="ml-2">
                • {channels.length} canal{channels.length !== 1 ? 'es' : ''} 
                {channels.some(c => c.channel_type === 'instagram' && c.is_connected) && (
                  <span className="ml-1 text-pink-600 font-medium">📱 Instagram detectado</span>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchChannels();
            }}
          >
            🔄 Actualizar
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="h-5 w-5" />
            <span className="text-sm">Configuración</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WhatsApp */}
        <ChannelCard
          title="WhatsApp Business"
          icon={Phone}
          color="bg-green-600"
          connected={getChannelStatus('whatsapp')}
          description="Conecta tu número de WhatsApp Business"
        >
          <div className="space-y-4">
            {!getChannelStatus('whatsapp') ? (
              <>
                <Button 
                  onClick={handleWhatsAppLogin}
                  disabled={isConnectingWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isConnectingWhatsApp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Conectar WhatsApp Business
                    </>
                  )}
                </Button>

                <div className="bg-green-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-green-900 text-sm mb-1">Embedded Signup automático:</h4>
                  <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                    <li>Autoriza tu cuenta de WhatsApp Business</li>
                    <li>Selecciona el número de teléfono a conectar</li>
                    <li>Configuración automática del webhook</li>
                    <li>Comienza a recibir mensajes al instante</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {channels
                  .filter(c => c.channel_type === 'whatsapp')
                  .map((channel) => {
                    const config = channel.channel_config as WhatsAppConfig;
                    return (
                      <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">{config?.verified_name || config?.business_name || 'WhatsApp Business'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600 text-xs">
                              Conectado
                            </Badge>
                            <Badge 
                              variant={config?.webhook_configured ? "default" : "secondary"} 
                              className={`text-xs ${config?.webhook_configured ? 'bg-green-600' : 'bg-gray-400'}`}
                            >
                              {config?.webhook_configured ? 'Webhook OK' : 'Webhook Pendiente'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-green-800 space-y-1">
                          <p>Número: {config?.display_phone_number || 'N/A'}</p>
                          <p>WABA ID: {config?.business_account_id || 'N/A'}</p>
                          <p>Estado: {config?.account_review_status || 'N/A'}</p>
                          <p>Verificación: {config?.business_verification_status || 'N/A'}</p>
                          <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                          {config?.webhook_configured && (
                            <p className="text-green-700 font-medium">Recibiendo mensajes automáticamente</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-green-600 border-green-300 hover:bg-green-100"
                            onClick={() => handleWhatsAppLogin()}
                            disabled={isConnectingWhatsApp}
                          >
                            {isConnectingWhatsApp ? 'Conectando...' : 'Reconectar'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </ChannelCard>

        {/* Facebook */}
        <ChannelCard
          title="Facebook Messenger"
          icon={Facebook}
          color="bg-blue-600"
          connected={getChannelStatus('facebook')}
          description="Conecta tus páginas de Facebook"
        >
          <div className="space-y-4">
            {!getChannelStatus('facebook') ? (
              <>
                <Button 
                  onClick={handleFacebookLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Conectar con Facebook
                </Button>

                <div className="bg-blue-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-blue-900 text-sm mb-1">Conexión automática:</h4>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Inicia sesión con tu cuenta de Facebook</li>
                    <li>Selecciona las páginas que quieres conectar</li>
                    <li>Autoriza los permisos necesarios</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {channels
                  .filter(c => c.channel_type === 'facebook')
                  .map((channel) => {
                    const config = channel.channel_config as FacebookConfig;
                    return (
                      <div key={channel.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">{config?.page_name || 'Página de Facebook'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-600 text-xs">
                              Conectado
                            </Badge>
                            <Badge 
                              variant={config?.webhook_subscribed ? "default" : "secondary"} 
                              className={`text-xs ${config?.webhook_subscribed ? 'bg-green-600' : 'bg-gray-400'}`}
                            >
                              {config?.webhook_subscribed ? 'Webhook OK' : 'Webhook Pendiente'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p>ID: {config?.page_id || 'N/A'}</p>
                          <p>Webhook: {config?.webhook_subscribed ? 'Activo' : 'Inactivo'}</p>
                          <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                          {config?.webhook_subscribed && (
                            <p className="text-green-700 font-medium">Recibiendo mensajes automáticamente</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-100"
                            onClick={() => handleFacebookLogin()}
                          >
                            Reconectar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs border-green-300 hover:bg-green-100 text-green-700"
                            onClick={() => handleTestWebhook(channel.id)}
                          >
                            Test Webhook
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs border-purple-300 hover:bg-purple-100 text-purple-700"
                            onClick={() => setShowWebhookMonitor(true)}
                          >
                            Monitorear
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </ChannelCard>

        {/* Instagram */}
        <ChannelCard
          title="Instagram Direct"
          icon={Instagram}
          color="bg-pink-600"
          connected={getChannelStatus('instagram')}
          description="Conecta tus cuentas de Instagram"
        >
          <div className="space-y-4">
            {!getChannelStatus('instagram') ? (
              <>
                <Button 
                  onClick={handleInstagramLogin}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Conectar con Instagram
                </Button>

                <div className="bg-pink-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-pink-900 text-sm mb-1">Conexión automática:</h4>
                  <ul className="text-xs text-pink-800 space-y-1 list-disc list-inside">
                    <li>Inicia sesión con tu cuenta de Instagram</li>
                    <li>Selecciona las cuentas profesionales</li>
                    <li>Autoriza los permisos de mensajería</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {channels
                  .filter(c => c.channel_type === 'instagram')
                  .map((channel) => {
                    const config = channel.channel_config as InstagramConfig;
                    const needsVerification = instagramNeedsVerification(config);
                    const channelVerification = igVerifications[channel.id];
                    const isGenerating = isGeneratingCode[channel.id];
                    
                    return (
                      <div key={channel.id} className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-pink-900">@{config?.username || 'Cuenta de Instagram'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-pink-600 text-xs">
                              Conectado
                            </Badge>
                            {needsVerification ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                Necesita Verificación
                              </Badge>
                            ) : (
                              <Badge 
                                variant={config?.webhook_subscribed ? "default" : "secondary"} 
                                className={`text-xs ${config?.webhook_subscribed ? 'bg-green-600' : 'bg-gray-400'}`}
                              >
                                {config?.webhook_subscribed ? 'Webhook OK' : 'Webhook Pendiente'}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {config?.account_type || 'PERSONAL'}
                            </Badge>
                          </div>
                        </div>

                        {needsVerification && (
                          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-800 text-sm">Verificación Requerida</span>
                            </div>
                            <p className="text-xs text-yellow-700 mb-2">
                              Instagram requiere verificar la cuenta comercial para recibir mensajes correctamente.
                            </p>
                            
                            {!channelVerification ? (
                              <Button 
                                size="sm" 
                                onClick={() => generateInstagramVerificationCode(channel.id)}
                                disabled={isGenerating}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    Generando...
                                  </>
                                ) : (
                                  'Generar Código de Verificación'
                                )}
                              </Button>
                            ) : (
                              <VerificationCodeDisplay
                                verification={channelVerification}
                                onCopy={(code) => {
                                  navigator.clipboard.writeText(code);
                                  toast({ 
                                    title: "📋 Código copiado al portapapeles",
                                    description: "Ahora pégalo en un mensaje de Instagram"
                                  });
                                }}
                                isPolling={!!verificationPolling[channel.id]}
                              />
                            )}
                          </div>
                        )}

                        <div className="text-xs text-pink-800 space-y-1">
                          <p>Usuario ID: {config?.instagram_user_id || 'N/A'}</p>
                          {config?.instagram_business_account_id && (
                            <p>Business Account ID: {config.instagram_business_account_id}</p>
                          )}
                          <p>Tipo de cuenta: {config?.account_type || 'PERSONAL'}</p>
                          <p>Token: {config?.token_type || 'short_lived'} ({config?.expires_at ? new Date(config.expires_at) > new Date() ? 'Válido' : 'Expirado' : 'N/A'})</p>
                          <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                          {config?.expires_at && (
                            <p className={`font-medium ${new Date(config.expires_at) > new Date() ? 'text-green-700' : 'text-red-700'}`}>
                              {new Date(config.expires_at) > new Date() 
                                ? `Expira: ${new Date(config.expires_at).toLocaleDateString('es-ES')}` 
                                : 'Token expirado'
                              }
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-pink-600 border-pink-300 hover:bg-pink-100"
                            onClick={() => handleInstagramLogin()}
                          >
                            Reconectar
                          </Button>
                          {!needsVerification && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs border-green-300 hover:bg-green-100 text-green-700"
                              onClick={() => handleTestWebhook(channel.id)}
                            >
                              Test Webhook
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </ChannelCard>
      </div>

      {/* Estado de canales conectados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Estado de Canales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {getChannelStatus('whatsapp') && (
                <Badge variant="default" className="bg-green-600">
                  <Phone className="h-3 w-3 mr-1" />
                  WhatsApp
                </Badge>
              )}
              {getChannelStatus('facebook') && (
                <Badge variant="default" className="bg-blue-600">
                  <Facebook className="h-3 w-3 mr-1" />
                  Facebook
                </Badge>
              )}
              {getChannelStatus('instagram') && (
                <Badge variant="default" className="bg-pink-600">
                  <Instagram className="h-3 w-3 mr-1" />
                  Instagram
                  {(() => {
                    const igChannel = channels.find(c => c.channel_type === 'instagram');
                    const config = igChannel?.channel_config as InstagramConfig;
                    const needsVerification = config ? instagramNeedsVerification(config) : false;
                    return needsVerification ? ' (Necesita Verificación)' : ' (Verificado)';
                  })()}
                </Badge>
              )}
              {!getChannelStatus('whatsapp') && !getChannelStatus('facebook') && !getChannelStatus('instagram') && (
                <p className="text-muted-foreground text-sm">No hay canales conectados</p>
              )}
            </div>

            {/* Debug info for development */}
            {channels.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Estado de Conexiones (Debug):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {channels.map(channel => {
                    const config = channel.channel_config as InstagramConfig | FacebookConfig | WhatsAppConfig;
                    const isConnected = getChannelStatus(channel.channel_type);
                    
                    return (
                      <div key={channel.id} className={`p-2 rounded border ${
                        isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="font-medium">
                          {channel.channel_type.toUpperCase()}
                          {isConnected ? ' ✅' : ' ❌'}
                        </div>
                        {channel.channel_type === 'instagram' && (
                          <div className="text-gray-600">
                            @{(config as InstagramConfig)?.username}
                            {instagramNeedsVerification(config as InstagramConfig) && (
                              <div className="text-yellow-600 font-medium">⚠️ Needs Verification</div>
                            )}
                          </div>
                        )}
                        {channel.channel_type === 'facebook' && (
                          <div className="text-gray-600">
                            {(config as FacebookConfig)?.page_name}
                          </div>
                        )}
                        {channel.channel_type === 'whatsapp' && (
                          <div className="text-gray-600">
                            {(config as WhatsAppConfig)?.business_name || (config as WhatsAppConfig)?.display_phone_number}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monitor de Webhook en tiempo real */}
      {showWebhookMonitor && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Monitor de Webhook en Tiempo Real
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowWebhookMonitor(false)}
              >
                Cerrar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitorea los eventos que recibe tu webhook de Facebook (logs en consola)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Instrucciones para monitorear:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Mantén esta ventana abierta</li>
                  <li>Envía un mensaje a tu página de Facebook</li>
                  <li>Observa los logs en tu terminal de Docker</li>
                  <li>Los eventos aparecerán en tiempo real</li>
                  <li>Usa "Test Webhook" para probar la funcionalidad</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Comando para ver logs:</h4>
                <code className="text-sm bg-blue-100 p-2 rounded block">
                  docker logs contenedor_supabase -f | grep -E "(webhook|messenger|facebook)"
                </code>
                <p className="text-xs text-blue-600 mt-2">
                  Los logs detallados se muestran en la consola del contenedor
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Test rápido:</h4>
                <p className="text-sm text-green-700 mb-2">
                  Haz clic en "Test Webhook" para simular un mensaje entrante y verificar el procesamiento
                </p>
                <Button 
                  size="sm"
                  onClick={() => {
                    const facebookChannel = channels.find(c => c.channel_type === 'facebook');
                    if (facebookChannel) {
                      handleTestWebhook(facebookChannel.id);
                    }
                  }}
                >
                  Ejecutar Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChannelsView;
