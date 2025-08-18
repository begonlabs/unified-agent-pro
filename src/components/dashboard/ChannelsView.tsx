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
  accounts: string[];
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
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
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

        const whatsappChannel = (data as Channel[] | null | undefined)?.find(
          (c) => c.channel_type === 'whatsapp'
        );
        if (
          whatsappChannel?.channel_config &&
          typeof whatsappChannel.channel_config === 'object' &&
          !Array.isArray(whatsappChannel.channel_config)
        ) {
          const config = whatsappChannel.channel_config as Partial<WhatsAppConfig>;
          if (config.phone_number) {
            setWhatsappPhone(config.phone_number);
          }
        }
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
    return channel?.is_connected || false;
  };

  const handleWhatsAppVerification = async () => {
    if (!whatsappPhone) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu número de WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate SMS verification (en producción aquí llamarías a WhatsApp Cloud API)
      setTimeout(() => {
        setShowVerification(true);
        setIsVerifying(false);
        toast({
          title: "Código enviado",
          description: "Revisa tu WhatsApp para el código de verificación",
        });
      }, 2000);
    } catch (error) {
      setIsVerifying(false);
      toast({
        title: "Error",
        description: "No se pudo enviar el código de verificación",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppConnect = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de verificación",
        variant: "destructive",
      });
      return;
    }

    try {
      const config = { phone_number: whatsappPhone };
      const existingChannel = channels.find(c => c.channel_type === 'whatsapp');

      if (existingChannel) {
        await supabaseUpdate(
          supabase
            .from('communication_channels')
            .update({
              channel_config: config,
              is_connected: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingChannel.id)
        );
      } else {
        await supabaseInsert(
          supabase
            .from('communication_channels')
            .insert({
              channel_type: 'whatsapp',
              channel_config: config,
              is_connected: true,
              user_id: (await supabase.auth.getUser()).data.user?.id
            })
        );
      }

      await fetchChannels();
      setShowVerification(false);
      setVerificationCode('');
      toast({
        title: "¡Éxito!",
        description: "WhatsApp conectado exitosamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo conectar WhatsApp",
        variant: "destructive",
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

  const handleInstagramLogin = () => {
    // Similar a Facebook
    toast({
      title: "Próximamente", 
      description: "La integración con Instagram estará disponible pronto",
    });
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
                <div className="space-y-2">
                  <Label htmlFor="wa-phone">Número de WhatsApp</Label>
                  <Input
                    id="wa-phone"
                    placeholder="+57 300 123 4567"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa tu número con código de país
                  </p>
                </div>

                {!showVerification ? (
                  <Button 
                    onClick={handleWhatsAppVerification}
                    disabled={isVerifying}
                    className="w-full"
                  >
                    {isVerifying ? "Enviando código..." : "Verificar número"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Código de verificación</Label>
                    <Input
                      id="verification-code"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button 
                      onClick={handleWhatsAppConnect}
                      className="w-full"
                    >
                      Conectar WhatsApp
                    </Button>
                  </div>
                )}

                <div className="bg-green-50 p-3 rounded-lg border">
                  <h4 className="font-medium text-green-900 text-sm mb-1">Pasos simples:</h4>
                  <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                    <li>Ingresa tu número de WhatsApp Business</li>
                    <li>Recibirás un código por SMS</li>
                    <li>Ingresa el código para verificar</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium">WhatsApp conectado</p>
                <p className="text-sm text-muted-foreground">{whatsappPhone}</p>
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
                            className="text-xs border-gray-300 hover:bg-gray-100"
                            onClick={() => {
                              // Verificar webhook
                              const webhookUrl = `${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/meta-webhook`;
                              window.open(webhookUrl, '_blank');
                            }}
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
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-pink-600 mx-auto mb-2" />
                <p className="font-medium">Instagram conectado</p>
                <p className="text-sm text-muted-foreground">Cuentas sincronizadas</p>
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
    </div>
  );
};

export default ChannelsView;