
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Settings, 
  Plus,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const ChannelsView = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const { toast } = useToast();

  const channels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Conecta tu número de WhatsApp Business para recibir y enviar mensajes',
      icon: Phone,
      color: 'text-green-400',
      bgColor: 'from-green-600 to-emerald-600',
      connected: whatsappConnected,
      setConnected: setWhatsappConnected,
      stats: { messages: 1456, leads: 89 }
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      description: 'Integra tu página de Facebook para gestionar mensajes de Messenger',
      icon: Facebook,
      color: 'text-blue-400',
      bgColor: 'from-blue-600 to-blue-700',
      connected: facebookConnected,
      setConnected: setFacebookConnected,
      stats: { messages: 892, leads: 45 }
    },
    {
      id: 'instagram',
      name: 'Instagram Direct',
      description: 'Conecta tu cuenta de Instagram Business para mensajes directos',
      icon: Instagram,
      color: 'text-pink-400',
      bgColor: 'from-pink-600 to-purple-600',
      connected: instagramConnected,
      setConnected: setInstagramConnected,
      stats: { messages: 499, leads: 22 }
    }
  ];

  const handleToggleChannel = (channelId: string, setConnected: (value: boolean) => void, currentValue: boolean) => {
    setConnected(!currentValue);
    toast({
      title: !currentValue ? "Canal conectado" : "Canal desconectado",
      description: `${channelId} ha sido ${!currentValue ? 'conectado' : 'desconectado'} exitosamente.`,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-zinc-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-2">Canales de Comunicación</h1>
        <p className="text-zinc-400 font-mono tracking-wide">
          Configura y gestiona tus canales de comunicación para recibir mensajes de clientes
        </p>
      </div>

      {/* Channel Cards */}
      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <Card key={channel.id} className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-sm bg-gradient-to-r ${channel.bgColor}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="font-mono text-white uppercase tracking-wider">{channel.name}</CardTitle>
                      <CardDescription className="text-zinc-400 font-mono text-sm">
                        {channel.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={channel.connected ? "default" : "secondary"} 
                      className={`font-mono ${channel.connected ? 'bg-green-600 text-white' : 'bg-zinc-600 text-zinc-300'}`}
                    >
                      {channel.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {channel.connected && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-700/30 rounded-sm border border-zinc-600">
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-white">{channel.stats.messages.toLocaleString()}</div>
                      <div className="text-sm text-zinc-400 font-mono">Mensajes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-mono font-bold text-white">{channel.stats.leads}</div>
                      <div className="text-sm text-zinc-400 font-mono">Leads</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channel.connected}
                      onCheckedChange={(checked) => handleToggleChannel(channel.name, channel.setConnected, channel.connected)}
                    />
                    <Label className="text-zinc-300 font-mono uppercase tracking-wider">
                      {channel.connected ? 'Activo' : 'Inactivo'}
                    </Label>
                  </div>
                  
                  {channel.connected ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className={`bg-gradient-to-r ${channel.bgColor} hover:opacity-90 font-mono uppercase tracking-wider`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                </div>

                {!channel.connected && (
                  <div className="p-3 bg-zinc-800/50 rounded-sm border border-zinc-600">
                    <p className="text-sm text-zinc-400 font-mono mb-2">Para conectar {channel.name}:</p>
                    <ol className="text-xs text-zinc-500 font-mono space-y-1 list-decimal list-inside">
                      <li>Haz clic en "Conectar"</li>
                      <li>Autoriza la aplicación</li>
                      <li>Configura los permisos necesarios</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Help */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configuración Avanzada
          </CardTitle>
          <CardDescription className="text-zinc-400 font-mono">
            Opciones adicionales para optimizar tus canales de comunicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-zinc-300 font-mono uppercase tracking-wider">URL de Webhook</Label>
              <Input
                id="webhook-url"
                placeholder="https://tu-dominio.com/webhook"
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-zinc-300 font-mono uppercase tracking-wider">API Key</Label>
              <Input
                id="api-key"
                placeholder="Tu clave API"
                type="password"
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-mono uppercase tracking-wider">
              Guardar Configuración
            </Button>
            <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelsView;
