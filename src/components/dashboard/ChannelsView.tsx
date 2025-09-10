import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseInsert, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, Facebook, Instagram, Settings, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  access_token: string;
  account_type: string;
  token_type: string;
  expires_at: string;
  connected_at: string;
  media_count?: number;
  webhook_subscribed?: boolean;
}

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
  const { toast } = useToast();

  const fetchChannels = useCallback(async () => {
    try {
      if (user && user.id) {
        console.log('🔍 Fetching channels for user:', user.id);
        
        const { data } = await supabaseSelect(
          supabase
            .from('communication_channels')
            .select('*')
            .eq('user_id', user.id)
        );
        
        console.log('📡 Channels fetched:', data?.length || 0);
        
        // Debug: Mostrar información detallada de los canales
        if (data && data.length > 0) {
          console.log('🔍 Channel Status Debug:');
          data.forEach(channel => {
            console.log(`📱 ${channel.channel_type.toUpperCase()}:`, {
              id: channel.id,
              is_connected: channel.is_connected,
              config: channel.channel_config,
              has_config: Boolean(channel.channel_config),
              config_keys: channel.channel_config ? Object.keys(channel.channel_config) : []
            });
          });
        }
        
        // Verificar estado de webhook para canales de Facebook
        if (data) {
          for (const channel of data) {
            if (channel.channel_type === 'facebook' && channel.channel_config?.webhook_subscribed) {
              // Verificar si el webhook está funcionando
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

  // Check for success parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    
    if (successParam === 'true') {
      // Refresh channels to show the newly connected one
      setTimeout(() => {
        fetchChannels();
      }, 1000);
      
      // Show success message
      const pageName = urlParams.get('page_name');
      const channel = urlParams.get('channel');
      
      if (pageName && channel) {
        toast({
          title: "✅ Canal reconectado exitosamente",
          description: `${channel === 'facebook' ? 'Facebook' : 'Canal'} actualizado: ${pageName}`,
        });
      }
    }
  }, [fetchChannels, toast]);


  const getChannelStatus = (channelType: string) => {
    const channel = channels.find(c => c.channel_type === channelType);
    
    if (!channel || !channel.channel_config) {
      console.log(`❌ ${channelType}: No channel or config found`);
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
        
        console.log(`📱 WHATSAPP Status:`, {
          hasPhoneNumberId,
          hasBusinessAccountId,
          hasAccessToken: hasAccessToken ? '✅' : '❌',
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
        
        console.log(`📘 FACEBOOK Status:`, {
          hasPageId,
          hasPageToken: hasPageToken ? '✅' : '❌',
          hasUserToken: hasUserToken ? '✅' : '❌',
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
        const status = hasUsername && hasAccessToken && hasInstagramUserId && hasAccountType && isConnected && isTokenValid;
        
        console.log(`📷 INSTAGRAM Status:`, {
          hasUsername,
          hasAccessToken: hasAccessToken ? '✅' : '❌',
          hasInstagramUserId,
          hasAccountType,
          isConnected,
          isTokenValid,
          username: config?.username,
          accountType: config?.account_type,
          expiresAt: config?.expires_at,
          finalStatus: status
        });
        
        return status;
      }
      
      default:
        // Para otros tipos de canal, usar la lógica anterior
        return channel?.is_connected || false;
    }
  };

  const handleWhatsAppLogin = async () => {
    try {
      console.log('🟢 Iniciando proceso de login de WhatsApp Business...');
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar WhatsApp',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('✅ Usuario autenticado:', user.id);

      // Configuración de WhatsApp Business API Embedded Signup
      const WHATSAPP_APP_ID = import.meta.env.VITE_META_APP_ID || '728339836340255';
      const WHATSAPP_GRAPH_VERSION = import.meta.env.VITE_META_GRAPH_VERSION || 'v20.0';
      const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

      // URL de callback para WhatsApp Embedded Signup
      const redirectUri = `${EDGE_BASE_URL}/functions/v1/whatsapp-embedded-signup`;
      
      // Scopes requeridos para WhatsApp Business API
      const scope = [
        'whatsapp_business_messaging',
        'whatsapp_business_management'
      ].join(',');

      // State parameter con user_id para el callback
      const state = encodeURIComponent(JSON.stringify({ 
        user_id: user.id,
        channel: 'whatsapp'
      }));

      // URL de autorización de WhatsApp Business Embedded Signup
      const whatsappAuthUrl = `https://www.facebook.com/${WHATSAPP_GRAPH_VERSION}/dialog/oauth?` +
        `client_id=${WHATSAPP_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${state}&` +
        `config_id=YOUR_WHATSAPP_CONFIG_ID`; // Este viene de tu configuración de Meta

      console.log('🔗 WhatsApp OAuth URL construida:', whatsappAuthUrl);
      console.log('👤 User ID:', user.id);
      
      // Mostrar mensaje informativo
      toast({
        title: "🟢 Conectando WhatsApp Business",
        description: "Te redirigimos a Meta para autorizar tu cuenta de WhatsApp Business...",
      });
      
      // Redirigir a Meta para autorización
      window.location.href = whatsappAuthUrl;

    } catch (error: unknown) {
      console.error('Error building WhatsApp OAuth URL:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conexión con WhatsApp Business',
        variant: 'destructive',
      });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      console.log('🔍 Iniciando proceso de login de Facebook...');
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Facebook',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('✅ Usuario autenticado:', user.id);

      const META_APP_ID = import.meta.env.VITE_META_APP_ID || '728339836340255';
      const META_GRAPH_VERSION = import.meta.env.VITE_META_GRAPH_VERSION || 'v23.0';
      const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

      const redirectUri = `${EDGE_BASE_URL}/functions/v1/meta-oauth`;
      const scope = [
        'pages_show_list',
        'pages_manage_metadata',
        'pages_messaging',
        // 'public_profile' is default and not needed explicitly; 'email' is unnecessary for Pages
      ].join(',');

      // Pass user_id in state parameter for the OAuth callback
      console.log('🔍 User object completo:', user);
      console.log('🔍 User ID type:', typeof user.id);
      console.log('🔍 User ID value:', user.id);
      
      const state = encodeURIComponent(JSON.stringify({ user_id: user.id }));
      const oauthUrl = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

      console.log('🔗 OAuth URL construida:', oauthUrl);
      console.log('👤 User ID:', user.id);
      console.log('📝 State parameter:', state);

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
      console.log('🔍 Iniciando proceso de login de Instagram...');
      
      if (!user) {
        console.error('❌ Usuario no autenticado');
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para conectar Instagram',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('✅ Usuario autenticado:', user.id);

      // Usar la configuración correcta de Instagram Business API según Meta for Developers
      const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_BASIC_APP_ID || '1215743729877419';
      const EDGE_BASE_URL = import.meta.env.VITE_SUPABASE_EDGE_BASE_URL || 'https://supabase.ondai.ai';

      const redirectUri = `${EDGE_BASE_URL}/functions/v1/instagram-oauth`;
      
      // Scopes de Instagram Business API según Meta for Developers
      const scope = [
        'instagram_business_basic',
        'instagram_business_manage_messages', 
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights'
      ].join(',');

      // State parameter con user_id
      const state = encodeURIComponent(JSON.stringify({ 
        user_id: user.id
      }));

      const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?` +
        `client_id=${INSTAGRAM_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${state}`;

      console.log('🔗 Instagram OAuth URL construida:', instagramAuthUrl);
      console.log('👤 User ID:', user.id);
      console.log('📝 Client ID:', INSTAGRAM_CLIENT_ID);
      console.log('📝 Scopes:', scope);
      
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

      // Obtener configuración del canal
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

      // Only test webhooks for Facebook channels (Instagram has different webhook handling)
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
        title: "🧪 Probando webhook...",
        description: "Enviando mensaje de prueba para verificar el procesamiento",
      });

      // 1. Test del webhook (POST)
      console.log('🔍 Testing webhook endpoint...');
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
          console.log('✅ Webhook test passed');
        } else {
          console.warn('⚠️ Webhook test failed:', webhookTest.status);
        }
      } catch (webhookError) {
        console.warn('⚠️ Webhook test error:', webhookError);
      }

      // 2. Test del webhook con un mensaje de prueba
      console.log('🧪 Testing webhook with test message...');
      
      const testMessage = `🎯 Test desde OndAI - ${new Date().toLocaleTimeString()}`;
      
      // Enviar un mensaje de prueba al webhook para verificar que funciona
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
          title: "✅ Webhook funcionando",
          description: "El webhook está activo y procesando mensajes correctamente",
        });
        
        console.log('📊 Webhook test results:', {
          webhook_accessible: true,
          webhook_test_message: true,
          page_id: pageId,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorData = await webhookTestMessage.text();
        console.error('❌ Webhook test failed:', errorData);
        
        toast({
          title: "⚠️ Problema en webhook",
          description: "El webhook es accesible, pero hay problemas al procesar mensajes",
          variant: "destructive",
        });
      }

    } catch (error: unknown) {
      console.error('Error in Facebook integration test:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo completar el test";
      toast({
        title: "❌ Error en test",
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
          <p className="text-muted-foreground mt-1">Conecta tus redes sociales de manera sencilla</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings className="h-5 w-5" />
          <span className="text-sm">Conecta tus redes sociales</span>
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
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Conectar WhatsApp Business
                </Button>

                <div className="bg-green-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-green-900 text-sm mb-1">Conexión automática:</h4>
                  <ul className="text-xs text-green-800 space-y-1 list-disc list-inside">
                    <li>Autoriza tu cuenta de WhatsApp Business</li>
                    <li>Selecciona el número de teléfono a conectar</li>
                    <li>Configuración automática del webhook</li>
                    <li>¡Comienza a recibir mensajes al instante!</li>
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
                              {config?.webhook_configured ? '✅ Webhook' : '❌ Webhook'}
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
                            <p className="text-green-700 font-medium">✓ Recibiendo mensajes automáticamente</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-green-600 border-green-300 hover:bg-green-100"
                            onClick={() => handleWhatsAppLogin()}
                          >
                            Reconectar
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
                              {config?.webhook_subscribed ? '✅ Webhook' : '❌ Webhook'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-blue-800 space-y-1">
                          <p>ID: {config?.page_id || 'N/A'}</p>
                          <p>Webhook: {config?.webhook_subscribed ? '✅ Activo' : '❌ Inactivo'}</p>
                          <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                          {config?.webhook_subscribed && (
                            <p className="text-green-700 font-medium">✓ Recibiendo mensajes automáticamente</p>
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
                            📊 Monitorear
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
                            <Badge 
                              variant={config?.webhook_subscribed ? "default" : "secondary"} 
                              className={`text-xs ${config?.webhook_subscribed ? 'bg-green-600' : 'bg-gray-400'}`}
                            >
                              {config?.webhook_subscribed ? '✅ Webhook' : '❌ Webhook'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {config?.account_type || 'PERSONAL'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-pink-800 space-y-1">
                          <p>Usuario ID: {config?.instagram_user_id || 'N/A'}</p>
                          <p>Tipo de cuenta: {config?.account_type || 'PERSONAL'}</p>
                          <p>Token: {config?.token_type || 'short_lived'} ({config?.expires_at ? new Date(config.expires_at) > new Date() ? '✅ Válido' : '❌ Expirado' : 'N/A'})</p>
                          <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                          {config?.expires_at && (
                            <p className={`font-medium ${new Date(config.expires_at) > new Date() ? 'text-green-700' : 'text-red-700'}`}>
                              {new Date(config.expires_at) > new Date() 
                                ? `✓ Expira: ${new Date(config.expires_at).toLocaleDateString('es-ES')}` 
                                : '⚠️ Token expirado'
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs border-green-300 hover:bg-green-100 text-green-700"
                            onClick={() => handleTestWebhook(channel.id)}
                          >
                            Test Webhook
                          </Button>
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
            Canales Conectados
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              </Badge>
            )}
            {!getChannelStatus('whatsapp') && !getChannelStatus('facebook') && !getChannelStatus('instagram') && (
              <p className="text-muted-foreground text-sm">No hay canales conectados</p>
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
                📊 Monitor de Webhook en Tiempo Real
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
                <h4 className="font-medium mb-2">📋 Instrucciones para monitorear:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Mantén esta ventana abierta</li>
                  <li>Envía un mensaje a tu página de Facebook</li>
                  <li>Observa los logs en tu terminal de Docker</li>
                  <li>Los eventos aparecerán en tiempo real</li>
                  <li>Usa "Test Webhook" para probar la funcionalidad</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🔍 Comando para ver logs:</h4>
                <code className="text-sm bg-blue-100 p-2 rounded block">
                  docker logs &lt;contenedor_supabase&gt; -f | grep -E "(webhook|messenger|facebook)"
                </code>
                <p className="text-xs text-blue-600 mt-2">
                  Los logs detallados se muestran en la consola del contenedor
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🧪 Test rápido:</h4>
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