import React from 'react';
import { MessageCircle, Facebook, Instagram, BarChart3 } from 'lucide-react';
import { ChannelActivitySectionProps } from '../types';
import { GeneralStatsService } from '../services/generalStatsService';
import { ChannelCard } from './ChannelCard';

export const ChannelActivitySection: React.FC<ChannelActivitySectionProps> = ({ stats }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-[#3a0caa]" />
        <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Actividad por Canal</span>
      </h3>
      <div className="grid gap-6 md:grid-cols-3">
        <ChannelCard
          channel="whatsapp"
          messages={stats.whatsapp_messages}
          leads={stats.whatsapp_leads}
          icon={MessageCircle}
          iconColor={GeneralStatsService.getChannelIconColor('whatsapp')}
        />

        <ChannelCard
          channel="facebook"
          messages={stats.facebook_messages}
          leads={stats.facebook_leads}
          icon={Facebook}
          iconColor={GeneralStatsService.getChannelIconColor('facebook')}
        />

        <ChannelCard
          channel="instagram"
          messages={stats.instagram_messages}
          leads={stats.instagram_leads}
          icon={Instagram}
          iconColor={GeneralStatsService.getChannelIconColor('instagram')}
        />
      </div>
    </div>
  );
};
