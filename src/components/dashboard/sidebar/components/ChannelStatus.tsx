import React from 'react';
import { Loader2 } from 'lucide-react';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from '@/components/icons/ChannelIcons';
import { ChannelStatus } from '../types';

interface ChannelStatusProps {
  channelsStatus: ChannelStatus;
  channelsLoading: boolean;
  isMobile?: boolean;
  isCollapsed?: boolean;
}

export const ChannelStatusSection: React.FC<ChannelStatusProps> = ({
  channelsStatus,
  channelsLoading,
  isMobile = false,
  isCollapsed = false
}) => {
  const channels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: '',
      status: channelsStatus.whatsapp
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      color: '',
      status: channelsStatus.facebook
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: InstagramIcon,
      color: '',
      status: channelsStatus.instagram
    }
  ];

  // Hide completely when collapsed
  if (isCollapsed) {
    return null;
  }

  return (
    <div className={`flex-shrink max-h-[25vh] overflow-y-auto p-2 sm:p-4 border-t bg-gradient-to-b from-[#3a0caa]/5 to-[#710db2]/5 ${isMobile ? 'p-2' : 'p-4'}`}>
      <h3 className={`font-semibold text-[#3a0caa] mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2 ${isMobile ? 'text-xs' : 'text-sm'
        }`}>
        <div className={`bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-full ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
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
        <div className={`space-y-0.5 sm:space-y-1`}>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className={`flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 rounded-lg hover:bg-[#3a0caa]/5 transition-colors duration-200 ${isMobile ? 'text-[11px] gap-1.5 p-0.5' : 'text-xs gap-2 p-1'
                  }`}
              >
                <Icon className={`${channel.color} ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="font-medium">{channel.name}</span>
                <div className={`rounded-full ml-auto ${channel.status
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
