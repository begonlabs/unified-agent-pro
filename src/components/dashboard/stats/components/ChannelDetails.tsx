import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from '@/components/icons/ChannelIcons';
import { ChannelStat } from '../types';

interface ChannelDetailsProps {
  channelData: ChannelStat[];
}

export const ChannelDetails: React.FC<ChannelDetailsProps> = ({ channelData }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {channelData.map((channel) => (
      <Card key={channel.name}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{channel.name}</CardTitle>
          {channel.name === 'WhatsApp' && <WhatsAppIcon className="h-5 w-5" />}
          {channel.name === 'Facebook' && <FacebookIcon className="h-5 w-5" />}
          {channel.name === 'Instagram' && <InstagramIcon className="h-5 w-5" />}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mensajes</span>
              <span className="font-bold">{channel.messages.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(channel.messages / Math.max(...channelData.map(c => c.messages))) * 100}%`,
                  backgroundColor: channel.color
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Leads</span>
              <span className="font-bold">{channel.leads}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(channel.leads / Math.max(...channelData.map(c => c.leads))) * 100}%`,
                  backgroundColor: channel.color
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
