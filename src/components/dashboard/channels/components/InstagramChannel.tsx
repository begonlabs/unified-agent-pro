import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, Lock, CheckCircle } from 'lucide-react';
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
  const instagramChannels = (channels || []).filter(c => c.channel_type === 'instagram' || c.channel_type === 'instagram_legacy');
  const isConnected = instagramChannels.length > 0;

  // Check permissions
  const connectionCheck = profile ? canConnectChannel(profile, 'instagram', instagramChannels.length, channels.length) : { allowed: true };

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      {!isConnected ? (
        <div className="text-center space-y-4">
          {!connectionCheck.allowed ? (
            <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 text-left">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="ml-2">
                {connectionCheck.reason}
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-amber-800 underline font-semibold"
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



              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                <h4 className="font-medium text-[#3a0caa] text-xs sm:text-sm mb-1">Conexión automática:</h4>
                <ul className="text-xs text-indigo-800 space-y-1 list-disc list-inside">
                  <li>Inicia sesión con tu cuenta de Facebook</li>
                  <li>Selecciona la página vinculada a tu Instagram</li>
                  <li>Autoriza los permisos necesarios</li>
                </ul>
                <p className="text-xs text-indigo-700 mt-2 italic">
                  Nota: Tu cuenta de Instagram debe ser profesional y estar vinculada a una página de Facebook
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col">
          {instagramChannels.map((channel) => {
            const config = channel.channel_config as InstagramConfig;
            return (
              <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-green-900 text-sm sm:text-base">
                      @{config?.username || 'Cuenta de Instagram'} {channel.channel_type === 'instagram_legacy' && '(Legacy)'}
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
                  <p>Usuario ID: {config?.instagram_user_id || 'N/A'}</p>
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
