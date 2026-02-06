import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelStatsCardProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';

export const ChannelStatsCard: React.FC<ChannelStatsCardProps> = ({
  channel,
  stats
}) => {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white transition-colors duration-300 shadow-inner">
            {ClientStatsService.getChannelIcon(channel)}
          </div>
          <span className="font-bold text-slate-700 tracking-tight">
            {ClientStatsService.getChannelDisplayName(channel)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <div className="text-xl font-black text-slate-900 leading-none">
              {ClientStatsService.formatNumber(stats.messages)}
            </div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Mensajes</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-black text-[#3a0caa] leading-none">
              {ClientStatsService.formatNumber(stats.leads)}
            </div>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Leads</p>
          </div>
        </div>

        <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
          <div
            className={`h-full opacity-60 rounded-full ${channel === 'whatsapp' ? 'bg-emerald-500' : channel === 'facebook' ? 'bg-blue-500' : 'bg-pink-500'}`}
            style={{ width: stats.messages > 0 ? '70%' : '5%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};