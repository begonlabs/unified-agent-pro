import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock } from 'lucide-react';
import { Channel } from '../types';
import { GreenApiConnect } from './green-api/GreenApiConnect';
import { useAuth } from '@/hooks/useAuth';
import { ChannelPermissions } from '@/lib/channelPermissions';
import { Profile } from '@/components/dashboard/profile/types';
import { canConnectChannel } from '@/lib/channelPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WhatsAppChannelProps {
  channels: Channel[];
  isConnectingWhatsApp: boolean;
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
  permissions?: ChannelPermissions | null;
  profile?: Profile | null;
}

export const WhatsAppChannel: React.FC<WhatsAppChannelProps> = ({
  channels,
  onDisconnect,
  permissions,
  profile
}) => {
  const { user } = useAuth();

  const greenApiChannels = channels.filter(c => c.channel_type === 'whatsapp_green_api');
  const isConnected = greenApiChannels.length > 0;

  const handleGreenApiSuccess = () => {
    // Refresh the page to show the connected channel
    window.location.reload();
  };

  // Check permissions
  const connectionCheck = profile ? canConnectChannel(profile, 'whatsapp', greenApiChannels.length) : { allowed: true };

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-4">
          {!connectionCheck.allowed ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <Lock className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2">
                {connectionCheck.reason}
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-red-800 underline font-semibold"
                  onClick={() => window.location.href = '/dashboard/profile?tab=subscription'}
                >
                  Mejorar Plan
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            /* Green API Connection - No branding */
            user && (
              <GreenApiConnect
                userId={user.id}
                onSuccess={handleGreenApiSuccess}
              />
            )
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {greenApiChannels.map((channel) => {
            const config = channel.channel_config as any;
            return (
              <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 text-sm sm:text-base">
                      WhatsApp Business
                    </span>
                  </div>
                  <Badge variant="default" className="bg-green-600 text-xs">
                    En Línea
                  </Badge>
                </div>
                <div className="text-xs text-green-800 space-y-1">
                  <p>Instancia: {config?.idInstance || 'N/A'}</p>
                  <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                  <p className="text-green-700 font-medium">Recibiendo mensajes automáticamente</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
