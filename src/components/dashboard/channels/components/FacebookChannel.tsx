import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook } from 'lucide-react';
import { Channel, FacebookConfig } from '../types';

interface FacebookChannelProps {
  channels: Channel[];
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
  onTestWebhook: (channelId: string) => void;
}

export const FacebookChannel: React.FC<FacebookChannelProps> = ({
  channels,
  onConnect,
  onReconnect,
  onDisconnect,
  onTestWebhook
}) => {
  const facebookChannels = channels.filter(c => c.channel_type === 'facebook');
  const isConnected = facebookChannels.length > 0;

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <>
          <Button 
            onClick={onConnect}
            className="w-full bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Conectar con Facebook
          </Button>

          <div className="bg-blue-50 p-3 rounded-lg border">
            <h4 className="font-medium text-blue-900 text-xs sm:text-sm mb-1">Conexión automática:</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Inicia sesión con tu cuenta de Facebook</li>
              <li>Selecciona las páginas que quieres conectar</li>
              <li>Autoriza los permisos necesarios</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {facebookChannels.map((channel) => {
            const config = channel.channel_config as FacebookConfig;
            return (
              <div key={channel.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 text-sm sm:text-base">
                      {config?.page_name || 'Página de Facebook'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
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
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-100 text-xs sm:text-sm"
                    onClick={onReconnect}
                  >
                    Reconectar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-100 text-xs sm:text-sm"
                    onClick={() => onTestWebhook(channel.id)}
                  >
                    Test Webhook
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-100 text-xs sm:text-sm"
                    onClick={() => onDisconnect(channel.id)}
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
