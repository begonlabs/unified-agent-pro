import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Facebook, Instagram, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { ChannelStatusProps, InstagramConfig } from '../types';

export const ChannelStatus: React.FC<ChannelStatusProps> = ({ 
  channels, 
  getChannelStatus, 
  instagramNeedsVerification 
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
                {(() => {
                  const igChannel = channels.find(c => c.channel_type === 'instagram');
                  const config = igChannel?.channel_config as InstagramConfig;
                  const needsVerification = config ? instagramNeedsVerification(config) : false;
                  return needsVerification ? ' (Necesita Verificación)' : ' (Verificado)';
                })()}
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
                {channels.map(channel => {
                  const config = channel.channel_config as InstagramConfig | any;
                  const isConnected = getChannelStatus(channel.channel_type);
                  
                  return (
                    <div key={channel.id} className={`p-2 rounded border ${
                      isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="font-medium">
                        {channel.channel_type.toUpperCase()}
                        {isConnected ? <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" /> : <X className="inline h-4 w-4 text-red-500 ml-1" />}
                      </div>
                      {channel.channel_type === 'instagram' && (
                        <div className="text-gray-600">
                          @{(config as InstagramConfig)?.username}
                          {instagramNeedsVerification(config as InstagramConfig) && (
                            <div className="text-yellow-600 font-medium flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Needs Verification
                            </div>
                          )}
                        </div>
                      )}
                      {channel.channel_type === 'facebook' && (
                        <div className="text-gray-600">
                          {config?.page_name}
                        </div>
                      )}
                      {channel.channel_type === 'whatsapp' && (
                        <div className="text-gray-600">
                          {config?.business_name || config?.display_phone_number}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
