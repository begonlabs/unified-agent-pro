import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Facebook, Instagram, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { ChannelStatusProps, InstagramConfig, Channel } from '../types';

export const ChannelStatus: React.FC<ChannelStatusProps & { onHardDelete?: (id: string) => void }> = ({
  channels,
  getChannelStatus,
  onHardDelete
}) => {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          Estado de Canales
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-4">
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

          {/* Debug info for development */}
          {channels.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-700 text-xs sm:text-sm mb-2">Estado de Conexiones (Debug):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {(() => {
                  // Agrupar por tipo real (whatsapp vs otros)
                  const groupedByType = new Map<string, any[]>();

                  channels.forEach(channel => {
                    const normalizedType = channel.channel_type === 'whatsapp_green_api' ? 'whatsapp' : channel.channel_type;
                    if (!groupedByType.has(normalizedType)) {
                      groupedByType.set(normalizedType, []);
                    }
                    groupedByType.get(normalizedType)?.push(channel);
                  });

                  return Array.from(groupedByType.entries()).map(([type, typeChannels]) => {
                    const isWhatsApp = type === 'whatsapp';
                    const hasDuplicates = typeChannels.length > 1;

                    // Para el badge de arriba usamos el primero, pero abajo mostramos todos si hay duplicados
                    return typeChannels.map((channel, idx) => {
                      const config = channel.channel_config as any;
                      const isConnected = channel.is_connected;
                      const displayName = type.toUpperCase();
                      const instanceId = isWhatsApp ? (config?.idInstance || channel.id) : null;

                      return (
                        <div key={channel.id} className={`p-2 rounded border flex flex-col gap-1 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} ${hasDuplicates && idx > 0 ? 'opacity-70 border-dashed' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {displayName} {hasDuplicates && `(#${idx + 1})`}
                            </span>
                            {isConnected ? <CheckCircle className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                          </div>

                          <div className="flex flex-col text-[10px]">
                            <span className="text-gray-500">ID: {instanceId}</span>
                            {hasDuplicates && idx > 0 && (
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-amber-600 flex items-center gap-1 font-medium italic">
                                  <AlertTriangle className="h-2 w-2" /> Instancia huérfana
                                </span>
                                {onHardDelete && (
                                  <button
                                    onClick={() => onHardDelete(channel.id)}
                                    className="text-red-500 hover:text-red-700 underline font-bold"
                                  >
                                    ELIMINAR
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {channel.channel_type === 'instagram' && config?.username && <div className="text-gray-600">@{config.username}</div>}
                          {channel.channel_type === 'facebook' && config?.page_name && <div className="text-gray-600">{config.page_name}</div>}
                        </div>
                      );
                    });
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
