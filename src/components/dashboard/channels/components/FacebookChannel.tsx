import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Lock, CheckCircle } from 'lucide-react';
import { Channel, FacebookConfig } from '../types';
import { ChannelPermissions } from '@/lib/channelPermissions';
import { Profile } from '@/components/dashboard/profile/types';
import { canConnectChannel } from '@/lib/channelPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FacebookChannelProps {
  channels: Channel[];
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
  onTestWebhook: (channelId: string) => void;
  permissions?: ChannelPermissions | null;
  profile?: Profile | null;
}

export const FacebookChannel: React.FC<FacebookChannelProps> = ({
  channels,
  onConnect,
  onReconnect,
  onDisconnect,
  onTestWebhook,
  permissions,
  profile
}) => {
  const facebookChannels = channels.filter(c => c.channel_type === 'facebook');
  const isConnected = facebookChannels.length > 0;

  // Check permissions
  const connectionCheck = profile ? canConnectChannel(profile, 'facebook', facebookChannels.length, channels.length) : { allowed: true };

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      {!isConnected ? (
        <div className="text-center space-y-4">
          {!connectionCheck.allowed ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 text-left">
              <Lock className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2">
                {connectionCheck.reason}
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-red-800 underline font-semibold"
                  onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
                >
                  Mejorar Plan
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
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
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col">
          {facebookChannels.map((channel) => {
            const config = channel.channel_config as FacebookConfig;
            return (
              <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 text-sm sm:text-base">
                      {config?.page_name || 'Página de Facebook'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {channel.is_connected ? (
                      <Badge variant="default" className="bg-green-600 text-xs hover:bg-green-700 whitespace-nowrap shrink-0">
                        En Línea
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-600 text-xs">
                        Desconectado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-green-800 space-y-1">
                  <p>ID: {config?.page_id || 'N/A'}</p>
                  <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-700 border-green-300 hover:bg-green-100 text-xs sm:text-sm"
                    onClick={onReconnect}
                  >
                    Reconectar
                  </Button>
                  {channel.is_connected && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-100 text-xs sm:text-sm"
                      onClick={() => onDisconnect(channel.id)}
                    >
                      Desconectar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
