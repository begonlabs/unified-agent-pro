import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, FacebookLoginResponse } from '../types';
import { ChannelsService } from '../services/channelsService';

export const useChannelConnections = (user: User | null) => {
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const { toast } = useToast();

  // Función para cargar Facebook SDK
  const loadFacebookSDK = useCallback(() => {
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
  }, []);

  // Función para procesar la autorización de WhatsApp
  const processWhatsAppAuth = useCallback(async (code: string, state: string) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const result = await ChannelsService.processWhatsAppAuth(code, state, user);
      
      toast({
        title: "WhatsApp conectado exitosamente!",
        description: `Empresa: ${result.businessName} - Teléfono: ${result.phoneNumber}`,
      });
      
      return result;
    } catch (error: unknown) {
      console.error('Error processing WhatsApp authorization:', error);
      throw error;
    }
  }, [user, toast]);

  // Función para manejar la respuesta de WhatsApp OAuth
  const handleWhatsAppResponse = useCallback(async (response: FacebookLoginResponse, expectedState: string) => {
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
        
        // Send to backend
        await processWhatsAppAuth(authCode, expectedState);
        
      } else if (response.status === 'not_authorized') {
        throw new Error('Usuario no autorizó la aplicación WhatsApp');
      } else {
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
  }, [toast, processWhatsAppAuth]);

  // WhatsApp Login con Configuration ID
  const handleWhatsAppLogin = useCallback(async () => {
    try {
      if (!user) {
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

      toast({
        title: "Conectando WhatsApp Business",
        description: "Abriendo ventana de autorización de Meta...",
      });

      // Use Facebook Embedded Signup with Configuration ID
      window.FB.login((response: FacebookLoginResponse) => {
        handleWhatsAppResponse(response, state);
      }, {
        config_id: '789657450267769', // Configuration ID real
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
  }, [user, toast, loadFacebookSDK, handleWhatsAppResponse]);

  // Facebook Login
  const handleFacebookLogin = useCallback(async () => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Facebook',
          variant: 'destructive',
        });
        return;
      }

      const oauthUrl = ChannelsService.buildFacebookOAuthUrl(user);
      window.location.href = oauthUrl;
    } catch (error: unknown) {
      console.error('Error building Facebook OAuth URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Facebook',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Instagram Login
  const handleInstagramLogin = useCallback(async () => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Instagram',
          variant: 'destructive',
        });
        return;
      }

      const instagramAuthUrl = ChannelsService.buildInstagramOAuthUrl(user);
      window.location.href = instagramAuthUrl;
    } catch (error: unknown) {
      console.error('Error building Instagram OAuth URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Instagram',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  return {
    isConnectingWhatsApp,
    handleWhatsAppLogin,
    handleFacebookLogin,
    handleInstagramLogin
  };
};
