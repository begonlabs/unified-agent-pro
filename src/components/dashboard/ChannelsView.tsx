import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Phone, Facebook, Instagram, Settings, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  channel_type: string;
  channel_config: any;
  is_connected: boolean;
}

interface WhatsAppConfig {
  phone_number: string;
}

interface FacebookConfig {
  pages: string[];
}

interface InstagramConfig {
  accounts: string[];
}

const ChannelsView = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_channels')
        .select('*');

      if (error) throw error;
      setChannels(data || []);

      // Load existing WhatsApp number if exists
      const whatsappChannel = data?.find(c => c.channel_type === 'whatsapp');
      if (whatsappChannel?.channel_config && typeof whatsappChannel.channel_config === 'object' && !Array.isArray(whatsappChannel.channel_config)) {
        const config = whatsappChannel.channel_config as { phone_number?: string };
        if (config.phone_number) {
          setWhatsappPhone(config.phone_number);
        }
      }
    } catch (error: any) {
      console.error('Error fetching channels:', error);
      const isConnectionError = error.message?.includes('upstream connect error') || error.message?.includes('503');
      toast({
        title: "Error de conexión",
        description: isConnectionError 
          ? "Problemas de conectividad con la base de datos. Reintentando..." 
          : "No se pudieron cargar los canales",
        variant: "destructive",
      });
      
      if (isConnectionError) {
        setTimeout(() => {
          fetchChannels();
        }, 3000);
      }
    }
  };

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
            channel_type: 'whatsapp',
            channel_config: config,
            is_connected: true,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      await fetchChannels();
      setShowVerification(false);
      setVerificationCode('');
      toast({
        title: "¡Éxito!",
        description: "WhatsApp conectado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo conectar WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleFacebookLogin = () => {
    // Aquí integrarías Facebook Login SDK
    toast({
      title: "Próximamente",
      description: "La integración con Facebook estará disponible pronto",
    });
  };

  const handleInstagramLogin = () => {
    // Similar a Facebook
    toast({
      title: "Próximamente", 
      description: "La integración con Instagram estará disponible pronto",
    });
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
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">Facebook conectado</p>
                <p className="text-sm text-muted-foreground">Páginas sincronizadas</p>
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