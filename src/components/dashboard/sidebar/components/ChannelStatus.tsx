import React from 'react';
import { Loader2, Phone, Facebook, Instagram } from 'lucide-react';
import { ChannelStatus } from '../types';

interface ChannelStatusProps {
  channelsStatus: ChannelStatus;
  channelsLoading: boolean;
  isMobile?: boolean;
}

export const ChannelStatusSection: React.FC<ChannelStatusProps> = ({
  channelsStatus,
  channelsLoading,
  isMobile = false
}) => {
  const channels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: Phone,
      color: 'text-[#3a0caa]',
      status: channelsStatus.whatsapp
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-[#710db2]',
      status: channelsStatus.facebook
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      status: channelsStatus.instagram
    }
  ];

  return (
    <div className={`p-2 sm:p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5 ${isMobile ? 'p-2' : 'p-4'}`}>
      <h3 className={`font-semibold text-[#3a0caa] mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2 ${
        isMobile ? 'text-xs' : 'text-sm'
      }`}>
        <div className={`bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-full ${
          isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
        }`}></div>
        <span className={isMobile ? 'hidden sm:inline' : ''}>
          Canales Conectados
        </span>
        {isMobile && (
          <span className="sm:hidden">Canales</span>
        )}
      </h3>
      
      {channelsLoading ? (
        <div className={`flex items-center justify-center ${isMobile ? 'py-1' : 'py-4'}`}>
          <Loader2 className={`animate-spin text-blue-600 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <span className={`text-gray-600 ${isMobile ? 'ml-1 text-xs' : 'ml-2 text-sm'}`}>
            Cargando...
          </span>
        </div>
      ) : (
        <div className={`space-y-1 sm:space-y-3 ${isMobile ? 'space-y-1' : 'space-y-3'}`}>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div 
                key={channel.id}
                className={`flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200 ${
                  isMobile ? 'text-xs gap-2 p-1' : 'text-sm gap-3 p-2'
                }`}
              >
                <Icon className={`${channel.color} ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="font-medium">{channel.name}</span>
                <div className={`rounded-full ml-auto ${
                  channel.status 
                    ? 'bg-gradient-to-r from-[#3a0caa] to-[#710db2] animate-pulse' 
                    : 'bg-gray-400'
                } ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
