import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientDetailsModalProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';
import { ChannelStatsCard } from './ChannelStatsCard';
import { ActivitySummary } from './ActivitySummary';

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  client,
  onClose
}) => {
  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalles de {client.company_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* General client information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Empresa:</span>
                    <span className="font-medium">{client.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{client.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan:</span>
                    <Badge className={ClientStatsService.getPlanBadgeColor(client.plan_type)}>
                      {client.plan_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado:</span>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics by channel */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Estadísticas por Canal</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <ChannelStatsCard
                channel="whatsapp"
                stats={{ messages: client.stats.whatsapp_messages, leads: client.stats.whatsapp_leads }}
              />
              <ChannelStatsCard
                channel="facebook"
                stats={{ messages: client.stats.facebook_messages, leads: client.stats.facebook_leads }}
              />
              <ChannelStatsCard
                channel="instagram"
                stats={{ messages: client.stats.instagram_messages, leads: client.stats.instagram_leads }}
              />
            </div>
          </div>

          {/* Activity summary */}
          <ActivitySummary stats={client.stats} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
