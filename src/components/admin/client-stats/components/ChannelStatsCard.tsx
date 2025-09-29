import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChannelStatsCardProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';

export const ChannelStatsCard: React.FC<ChannelStatsCardProps> = ({
  channel,
  stats
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {ClientStatsService.getChannelIcon(channel)}
          {ClientStatsService.getChannelDisplayName(channel)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Mensajes:</span>
            <span className="font-bold text-lg">{ClientStatsService.formatNumber(stats.messages)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Leads:</span>
            <span className="font-bold text-lg">{ClientStatsService.formatNumber(stats.leads)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};