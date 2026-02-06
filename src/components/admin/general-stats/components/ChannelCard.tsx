import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelCardProps } from '../types';
import { GeneralStatsService } from '../services/generalStatsService';

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  messages,
  leads,
  icon: Icon,
  iconColor
}) => {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors duration-300`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="font-bold text-gray-800 tracking-tight">
            {GeneralStatsService.getChannelDisplayName(channel)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-[#1A1A1A]">
              {GeneralStatsService.formatNumber(messages)}
            </div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Mensajes</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold text-[#1A1A1A]">
              {GeneralStatsService.formatNumber(leads)}
            </div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Leads</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
