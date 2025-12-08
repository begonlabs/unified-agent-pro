import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, Lock } from 'lucide-react';
import { Channel, InstagramConfig } from '../types';
import { ChannelPermissions } from '@/lib/channelPermissions';
import { Profile } from '@/components/dashboard/profile/types';
import { canConnectChannel } from '@/lib/channelPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InstagramChannelProps {
  channels: Channel[];
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
  permissions?: ChannelPermissions | null;
  profile?: Profile | null;
}

export const InstagramChannel: React.FC<InstagramChannelProps> = ({
  channels,
  onConnect,
  onReconnect,
  onDisconnect,
  permissions,
  profile
}) => {
  const instagramChannels = channels.filter(c => c.channel_type === 'instagram');
  const isConnected = instagramChannels.length > 0;

  // Check permissions
  const connectionCheck = profile ? canConnectChannel(profile, 'instagram', instagramChannels.length, channels.length) : { allowed: true };

  return (
    <div className="space-y-4">
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
                <Instagram className="h-4 w-4 mr-2" />
                Conectar con Instagram
              </Button>

              <div className="bg-pink-50 p-3 rounded-lg border">
                <h4 className="font-medium text-pink-900 text-xs sm:text-sm mb-1">Conexión automática:</h4>
                <ul className="text-xs text-pink-800 space-y-1 list-disc list-inside">
                  <li>Inicia sesión con tu cuenta de Facebook</li>
                  <li>Selecciona la página vinculada a tu Instagram</li>
                  <li>Autoriza los permisos necesarios</li>
                </ul>
                <p className="text-xs text-pink-700 mt-2 italic">
                  Nota: Tu cuenta de Instagram debe ser profesional y estar vinculada a una página de Facebook
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {instagramChannels.map((channel) => {
            const config = channel.channel_config as InstagramConfig;
            return (
              <div key={channel.id} className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <span className="font-medium text-pink-900 text-sm sm:text-base">
                      @{config?.username || 'Cuenta de Instagram'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge variant="default" className="bg-pink-600 text-xs">
                      En Línea
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-pink-800 space-y-1">
                  <p>Usuario ID: {config?.instagram_user_id || 'N/A'}</p>
                  <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                  {config?.webhook_subscribed && (
                    <p className="text-green-700 font-medium">Recibiendo mensajes automáticamente</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-pink-600 border-pink-300 hover:bg-pink-100 text-xs sm:text-sm"
                    onClick={onReconnect}
                  >
                    Reconectar
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
