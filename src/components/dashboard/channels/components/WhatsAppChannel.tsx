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
  onHardDelete?: (channelId: string) => void;
  permissions?: ChannelPermissions | null;
  profile?: Profile | null;
}

export const WhatsAppChannel: React.FC<WhatsAppChannelProps> = ({
  channels,
  onDisconnect,
  onHardDelete,
  permissions,
  profile
}) => {
  const { user } = useAuth();

  // Filtrar canales para evitar duplicados en la UI (por idInstance)
  const greenApiChannels = React.useMemo(() => {
    const rawChannels = channels.filter(c => c.channel_type === 'whatsapp_green_api');
    const uniqueMap = new Map();

    // El orden de created_at en channels (puesto en fetchChannels) asegura que el más nuevo 
    // termine en el mapa si lo recorremos en orden.
    rawChannels.forEach(c => {
      const idInstance = (c.channel_config as any)?.idInstance;
      if (idInstance) {
        uniqueMap.set(String(idInstance), c);
      } else {
        // Si no tiene idInstance (raro), lo dejamos pasar con su ID de Supabase
        uniqueMap.set(`no_instance_${c.id}`, c);
      }
    });

    return Array.from(uniqueMap.values()) as Channel[];
  }, [channels]);

  const isConnected = greenApiChannels.some(c => c.is_connected);
  const unconnectedInstance = greenApiChannels.find(c => !c.is_connected);

  const [isDisconnecting, setIsDisconnecting] = React.useState<string | null>(null);

  const handleGreenApiSuccess = () => {
    // Refresh the page to show the connected channel
    window.location.reload();
  };

  const handleDisconnectWithLoading = async (channelId: string) => {
    setIsDisconnecting(channelId);
    try {
      // Guardar bandera en localStorage para evitar reconexión automática inmediata
      localStorage.setItem(`last_disconnect_${channelId}`, Date.now().toString());

      console.log(`⏳ Iniciando desconexión de canal: ${channelId}`);
      await onDisconnect(channelId);

      // Tras desconectar, esperamos un tiempo Prudencial (2s) 
      // para asegurar que los triggers de Supabase y el cache se sincronicen
      console.log('✅ Desconexión procesada, esperando sincronización...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error in handleDisconnectWithLoading:', error);
      setIsDisconnecting(null);
    }
  };

  // Check permissions
  const connectionCheck = profile ? canConnectChannel(profile, 'whatsapp', greenApiChannels.length, channels.length) : { allowed: true };

  return (
    <div className="space-y-4">
      {/* Case 1: No instance and no connection allowed (Upgrade required) */}
      {!isConnected && !unconnectedInstance && !connectionCheck.allowed && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
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
      )}

      {/* Case 2: No instance but connection is allowed (Show manual connect or waiting msg) */}
      {!isConnected && !unconnectedInstance && connectionCheck.allowed && user && (
        <div className="space-y-4">
          <GreenApiConnect
            userId={user.id}
            onSuccess={handleGreenApiSuccess}
            onInvalidInstance={() => onHardDelete && onHardDelete('manual_reset')}
          />
        </div>
      )}

      {/* Caso 3: Instancia asignada pero no conectada (Mostrar QR directamente) */}
      {!isConnected && unconnectedInstance && user && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-8 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
            <div className="bg-emerald-500 p-2.5 rounded-full shadow-sm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-900 font-bold">
                ¡Tu línea ha sido activada!
              </p>
              <p className="text-xs text-emerald-700 opacity-80">
                Escanea el código QR abajo para empezar a recibir mensajes con IA.
              </p>
            </div>
          </div>

          <GreenApiConnect
            userId={user.id}
            onSuccess={handleGreenApiSuccess}
            initialIdInstance={(unconnectedInstance.channel_config as any).idInstance}
            initialApiToken={(unconnectedInstance.channel_config as any).apiTokenInstance}
            onInvalidInstance={() => onHardDelete && onHardDelete(unconnectedInstance.id)}
          />
        </div>
      )}

      {/* Case 4: Connected instances list */}
      {isConnected && (
        <div className="space-y-3">
          {greenApiChannels.filter(c => c.is_connected).map((channel) => {
            const config = channel.channel_config as any;
            return (
              <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 text-sm sm:text-base">
                      WhatsApp Business (Green API)
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
                    disabled={isDisconnecting !== null}
                    onClick={() => handleDisconnectWithLoading(channel.id)}
                  >
                    {isDisconnecting === channel.id ? "Desconectando..." : "Desconectar"}
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
