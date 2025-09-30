import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, CheckCircle } from 'lucide-react';
import { Channel, WhatsAppConfig } from '../types';

interface WhatsAppChannelProps {
  channels: Channel[];
  isConnectingWhatsApp: boolean;
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
}

export const WhatsAppChannel: React.FC<WhatsAppChannelProps> = ({
  channels,
  isConnectingWhatsApp,
  onConnect,
  onReconnect,
  onDisconnect
}) => {
  const whatsappChannels = channels.filter(c => c.channel_type === 'whatsapp');
  const isConnected = whatsappChannels.length > 0;

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <>
          {/* Botón de conexión directa */}
          <Button 
            onClick={onConnect}
            disabled={isConnectingWhatsApp}
            className="w-full bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] disabled:opacity-50 text-white"
          >
            {isConnectingWhatsApp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Conectando...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Conectar WhatsApp Business
              </>
            )}
          </Button>

          {/* Información del proceso */}
          <div className="bg-blue-50 p-3 rounded-lg border">
            <h4 className="font-medium text-blue-900 text-xs sm:text-sm mb-1">
              Conecta tu WhatsApp Business:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Autoriza tu cuenta de WhatsApp Business</li>
              <li>Selecciona el número de teléfono a conectar</li>
              <li>Configuración automática del webhook</li>
              <li>Comienza a recibir mensajes al instante</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {whatsappChannels.map((channel) => {
            const config = channel.channel_config as WhatsAppConfig;
            return (
              <div key={channel.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 text-sm sm:text-base">
                      {config?.verified_name || config?.business_name || 'WhatsApp Business'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge variant="default" className="bg-green-600 text-xs">
                      Conectado
                    </Badge>
                    <Badge 
                      variant={config?.webhook_configured ? "default" : "secondary"} 
                      className={`text-xs ${config?.webhook_configured ? 'bg-green-600' : 'bg-gray-400'}`}
                    >
                      {config?.webhook_configured ? 'Webhook OK' : 'Webhook Pendiente'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-green-800 space-y-1">
                  <p>Número: {config?.display_phone_number || 'N/A'}</p>
                  <p>WABA ID: {config?.business_account_id || 'N/A'}</p>
                  <p>Estado: {config?.account_review_status || 'N/A'}</p>
                  <p>Verificación: {config?.business_verification_status || 'N/A'}</p>
                  <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                  {config?.webhook_configured && (
                    <p className="text-green-700 font-medium">Recibiendo mensajes automáticamente</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-green-600 border-green-300 hover:bg-green-100 text-xs sm:text-sm"
                    onClick={onReconnect}
                    disabled={isConnectingWhatsApp}
                  >
                    {isConnectingWhatsApp ? 'Conectando...' : 'Reconectar'}
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
