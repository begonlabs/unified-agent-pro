
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Facebook, Instagram, QrCode, Link, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  channel_type: string;
  channel_config: any;
  is_connected: boolean;
}

interface WhatsAppConfig {
  phone_number: string;
  api_token: string;
  webhook_url: string;
}

interface FacebookConfig {
  page_id: string;
  access_token: string;
  app_secret: string;
}

interface InstagramConfig {
  account_id: string;
  access_token: string;
}

const ChannelsView = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    phone_number: '',
    api_token: '',
    webhook_url: ''
  });
  const [facebookConfig, setFacebookConfig] = useState<FacebookConfig>({
    page_id: '',
    access_token: '',
    app_secret: ''
  });
  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>({
    account_id: '',
    access_token: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const isWhatsAppConfig = (config: any): config is WhatsAppConfig => {
    return config && typeof config === 'object' && 
           typeof config.phone_number === 'string' &&
           typeof config.api_token === 'string' &&
           typeof config.webhook_url === 'string';
  };

  const isFacebookConfig = (config: any): config is FacebookConfig => {
    return config && typeof config === 'object' && 
           typeof config.page_id === 'string' &&
           typeof config.access_token === 'string' &&
           typeof config.app_secret === 'string';
  };

  const isInstagramConfig = (config: any): config is InstagramConfig => {
    return config && typeof config === 'object' && 
           typeof config.account_id === 'string' &&
           typeof config.access_token === 'string';
  };

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_channels')
        .select('*');

      if (error) throw error;
      setChannels(data || []);

      // Load existing configurations with proper type checking
      data?.forEach(channel => {
        if (channel.channel_type === 'whatsapp' && channel.channel_config) {
          if (isWhatsAppConfig(channel.channel_config)) {
            setWhatsappConfig(channel.channel_config);
          }
        } else if (channel.channel_type === 'facebook' && channel.channel_config) {
          if (isFacebookConfig(channel.channel_config)) {
            setFacebookConfig(channel.channel_config);
          }
        } else if (channel.channel_type === 'instagram' && channel.channel_config) {
          if (isInstagramConfig(channel.channel_config)) {
            setInstagramConfig(channel.channel_config);
          }
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los canales",
        variant: "destructive",
      });
    }
  };

  const saveChannelConfig = async (channelType: string, config: any) => {
    try {
      const existingChannel = channels.find(c => c.channel_type === channelType);

      if (existingChannel) {
        const { error } = await supabase
          .from('communication_channels')
          .update({
            channel_config: config,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChannel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('communication_channels')
          .insert({
            channel_type: channelType,
            channel_config: config,
            is_connected: true,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      await fetchChannels();
      toast({
        title: "Configuración guardada",
        description: `${channelType} ha sido configurado exitosamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const getChannelStatus = (channelType: string) => {
    const channel = channels.find(c => c.channel_type === channelType);
    return channel?.is_connected || false;
  };

  const ChannelCard = ({ 
    title, 
    icon: Icon, 
    color, 
    connected, 
    description,
    children 
  }: any) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-500">{description}</p>
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

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración de Canales</h1>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">Conecta tus redes sociales</span>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-6">
          <ChannelCard
            title="WhatsApp Business"
            icon={Phone}
            color="bg-green-600"
            connected={getChannelStatus('whatsapp')}
            description="Conecta tu número de WhatsApp Business"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wa-phone">Número de Teléfono</Label>
                  <Input
                    id="wa-phone"
                    placeholder="+1234567890"
                    value={whatsappConfig.phone_number}
                    onChange={(e) => setWhatsappConfig(prev => ({
                      ...prev,
                      phone_number: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-token">Token de API</Label>
                  <Input
                    id="wa-token"
                    placeholder="Tu token de WhatsApp Business API"
                    value={whatsappConfig.api_token}
                    onChange={(e) => setWhatsappConfig(prev => ({
                      ...prev,
                      api_token: e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wa-webhook">URL de Webhook</Label>
                <Input
                  id="wa-webhook"
                  placeholder="https://tu-dominio.com/webhook"
                  value={whatsappConfig.webhook_url}
                  onChange={(e) => setWhatsappConfig(prev => ({
                    ...prev,
                    webhook_url: e.target.value
                  }))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => saveChannelConfig('whatsapp', whatsappConfig)}
                  className="flex-1"
                >
                  Guardar Configuración
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Generar QR
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instrucciones de Configuración</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Crea una cuenta de WhatsApp Business API</li>
                  <li>Obtén tu token de acceso desde Meta Developers</li>
                  <li>Configura el webhook en tu cuenta de Meta</li>
                  <li>Verifica tu número de teléfono</li>
                </ol>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>

        <TabsContent value="facebook" className="space-y-6">
          <ChannelCard
            title="Facebook Messenger"
            icon={Facebook}
            color="bg-blue-600"
            connected={getChannelStatus('facebook')}
            description="Conecta tu página de Facebook"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-page">ID de Página</Label>
                  <Input
                    id="fb-page"
                    placeholder="ID de tu página de Facebook"
                    value={facebookConfig.page_id}
                    onChange={(e) => setFacebookConfig(prev => ({
                      ...prev,
                      page_id: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-token">Token de Acceso</Label>
                  <Input
                    id="fb-token"
                    placeholder="Token de acceso de la página"
                    value={facebookConfig.access_token}
                    onChange={(e) => setFacebookConfig(prev => ({
                      ...prev,
                      access_token: e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fb-secret">App Secret</Label>
                <Input
                  id="fb-secret"
                  placeholder="Secreto de la aplicación"
                  value={facebookConfig.app_secret}
                  onChange={(e) => setFacebookConfig(prev => ({
                    ...prev,
                    app_secret: e.target.value
                  }))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => saveChannelConfig('facebook', facebookConfig)}
                  className="flex-1"
                >
                  Guardar Configuración
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Conectar Página
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instrucciones de Configuración</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Ve a Meta for Developers y crea una aplicación</li>
                  <li>Agrega el producto Messenger a tu aplicación</li>
                  <li>Genera un token de acceso para tu página</li>
                  <li>Configura los webhooks para eventos de mensaje</li>
                </ol>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>

        <TabsContent value="instagram" className="space-y-6">
          <ChannelCard
            title="Instagram Direct"
            icon={Instagram}
            color="bg-pink-600"
            connected={getChannelStatus('instagram')}
            description="Conecta tu cuenta profesional de Instagram"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ig-account">ID de Cuenta</Label>
                  <Input
                    id="ig-account"
                    placeholder="ID de tu cuenta de Instagram"
                    value={instagramConfig.account_id}
                    onChange={(e) => setInstagramConfig(prev => ({
                      ...prev,
                      account_id: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ig-token">Token de Acceso</Label>
                  <Input
                    id="ig-token"
                    placeholder="Token de acceso de Instagram"
                    value={instagramConfig.access_token}
                    onChange={(e) => setInstagramConfig(prev => ({
                      ...prev,
                      access_token: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => saveChannelConfig('instagram', instagramConfig)}
                  className="flex-1"
                >
                  Guardar Configuración
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Conectar Cuenta
                </Button>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-2">Instrucciones de Configuración</h4>
                <ol className="text-sm text-pink-800 space-y-1 list-decimal list-inside">
                  <li>Convierte tu cuenta a cuenta profesional de Instagram</li>
                  <li>Conecta tu página de Facebook con Instagram</li>
                  <li>Obtén permisos para Instagram Basic Display API</li>
                  <li>Configura los webhooks para mensajes directos</li>
                </ol>
              </div>
            </div>
          </ChannelCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChannelsView;
