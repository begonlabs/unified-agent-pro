import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Facebook, Instagram } from 'lucide-react';
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
          {channel.name === 'WhatsApp' && <Phone className="h-5 w-5 text-green-600" />}
          {channel.name === 'Facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
          {channel.name === 'Instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
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
