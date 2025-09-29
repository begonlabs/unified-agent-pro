import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{GeneralStatsService.getChannelDisplayName(channel)}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <div className="text-xl font-bold">{GeneralStatsService.formatNumber(messages)}</div>
            <p className="text-xs text-muted-foreground">Mensajes</p>
          </div>
          <div>
            <div className="text-xl font-bold">{GeneralStatsService.formatNumber(leads)}</div>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
