import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, AlertCircle } from 'lucide-react';
import { Channel, InstagramConfig, InstagramVerification } from '../types';
import { VerificationCodeDisplay } from './VerificationCodeDisplay';

interface InstagramChannelProps {
  channels: Channel[];
  onConnect: () => void;
  onReconnect: () => void;
  onDisconnect: (channelId: string) => void;
  instagramNeedsVerification: (config: InstagramConfig) => boolean;
  igVerifications: Record<string, InstagramVerification>;
  isGeneratingCode: Record<string, boolean>;
  verificationPolling: Record<string, NodeJS.Timeout>;
  onGenerateVerificationCode: (channelId: string) => void;
  onCopyCode: (code: string) => void;
}

export const InstagramChannel: React.FC<InstagramChannelProps> = ({
  channels,
  onConnect,
  onReconnect,
  onDisconnect,
  instagramNeedsVerification,
  igVerifications,
  isGeneratingCode,
  verificationPolling,
  onGenerateVerificationCode,
  onCopyCode
}) => {
  const instagramChannels = channels.filter(c => c.channel_type === 'instagram');
  const isConnected = instagramChannels.length > 0;

  return (
    <div className="space-y-4">
      {!isConnected ? (
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
              <li>Inicia sesión con tu cuenta de Instagram</li>
              <li>Selecciona las cuentas profesionales</li>
              <li>Autoriza los permisos de mensajería</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {instagramChannels.map((channel) => {
            const config = channel.channel_config as InstagramConfig;
            const needsVerification = instagramNeedsVerification(config);
            const channelVerification = igVerifications[channel.id];
            const isGenerating = isGeneratingCode[channel.id];
            
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
                      Conectado
                    </Badge>
                    {needsVerification ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        Necesita Verificación
                      </Badge>
                    ) : (
                      <Badge 
                        variant={config?.webhook_subscribed ? "default" : "secondary"} 
                        className={`text-xs ${config?.webhook_subscribed ? 'bg-green-600' : 'bg-gray-400'}`}
                      >
                        {config?.webhook_subscribed ? 'Webhook OK' : 'Webhook Pendiente'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {config?.account_type || 'PERSONAL'}
                    </Badge>
                  </div>
                </div>

                {needsVerification && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 text-sm">Verificación Requerida</span>
                    </div>
                    <p className="text-xs text-yellow-700 mb-2">
                      Instagram requiere verificar la cuenta comercial para recibir mensajes correctamente.
                    </p>
                    
                    {!channelVerification ? (
                      <Button 
                        size="sm" 
                        onClick={() => onGenerateVerificationCode(channel.id)}
                        disabled={isGenerating}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Generando...
                          </>
                        ) : (
                          'Generar Código de Verificación'
                        )}
                      </Button>
                    ) : (
                      <VerificationCodeDisplay
                        verification={channelVerification}
                        onCopy={onCopyCode}
                        isPolling={!!verificationPolling[channel.id]}
                      />
                    )}
                  </div>
                )}

                <div className="text-xs text-pink-800 space-y-1">
                  <p>Usuario ID: {config?.instagram_user_id || 'N/A'}</p>
                  {config?.instagram_business_account_id && (
                    <p>Business Account ID: {config.instagram_business_account_id}</p>
                  )}
                  <p>Tipo de cuenta: {config?.account_type || 'PERSONAL'}</p>
                  <p>Token: {config?.token_type || 'short_lived'} ({config?.expires_at ? new Date(config.expires_at) > new Date() ? 'Válido' : 'Expirado' : 'N/A'})</p>
                  <p>Conectado: {config?.connected_at ? new Date(config.connected_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                  {config?.expires_at && (
                    <p className={`font-medium ${new Date(config.expires_at) > new Date() ? 'text-green-700' : 'text-red-700'}`}>
                      {new Date(config.expires_at) > new Date() 
                        ? `Expira: ${new Date(config.expires_at).toLocaleDateString('es-ES')}` 
                        : 'Token expirado'
                      }
                    </p>
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
