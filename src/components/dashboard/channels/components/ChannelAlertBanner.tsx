import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useChannelsStatus } from '@/hooks/useChannelsStatus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ChannelAlertBanner: React.FC = () => {
  const { disconnectedChannels, loading, refreshChannels } = useChannelsStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;

    // Listen for realtime changes on the communication_channels table
    // (Requires Realtime to be enabled for this table in Supabase)
    const channelSubscription = supabase
      .channel(`channels_status_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication_channels',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('🔄 Realtime channel status change received');
          // When a change happens, refresh the status silently
          refreshChannels(true);
        }
      )
      .subscribe();

    // Fallback polling: Check for disconnections every 15 seconds silently
    // This ensures the banner appears even if Supabase Realtime is disabled for the table
    const pollInterval = setInterval(() => {
      refreshChannels(true);
    }, 15000);

    return () => {
      supabase.removeChannel(channelSubscription);
      clearInterval(pollInterval);
    };
  }, [user, refreshChannels]);

  if (loading || !disconnectedChannels) return null;

  // Filter out dismissed alerts and channels that are purely for internal status rather than actual connections
  const activeAlerts = disconnectedChannels.filter(c => {
    // Only alert for active primary channel platforms
    const isRelevantPlatform = ['facebook', 'instagram', 'instagram_legacy', 'whatsapp', 'whatsapp_green_api'].includes(c.channel_type);
    return isRelevantPlatform && !dismissed[c.id];
  });

  if (activeAlerts.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed(prev => ({ ...prev, [id]: true }));
  };

  const getPlatformName = (type: string) => {
    if (type.includes('whatsapp')) return 'WhatsApp';
    if (type.includes('facebook')) return 'Facebook';
    if (type.includes('instagram')) return 'Instagram';
    return type;
  };

  return (
    <div className="w-full flex justify-center p-4 h-auto absolute top-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 w-full max-w-4xl pointer-events-auto mt-2">
        {activeAlerts.map(channel => (
          <div 
            key={channel.id} 
            className="flex items-center justify-between p-3 px-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-sm animate-in slide-in-from-top-4 fade-in duration-300"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-sm">Problema de conexión con {getPlatformName(channel.channel_type)}</span>
                <span className="text-xs sm:text-sm opacity-90 hidden sm:inline">-</span>
                <span className="text-xs sm:text-sm opacity-90">
                  La conexión se ha perdido. Por favor, vuelve a conectarlo para seguir recibiendo mensajes.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => handleDismiss(channel.id)}
                className="p-1 hover:bg-red-100 rounded-md transition-colors text-red-500"
                aria-label="Cerrar alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
