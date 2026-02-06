import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClientDetailsModalProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';
import { ChannelStatsCard } from './ChannelStatsCard';
import { ActivitySummary } from './ActivitySummary';
import { Building2, Mail, ShieldCheck, Activity } from 'lucide-react';

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  client,
  onClose
}) => {
  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 border-none shadow-2xl overflow-hidden bg-slate-50/50 backdrop-blur-md">
        <DialogHeader className="bg-gradient-to-r from-[#3a0caa] to-[#710db2] p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-bold shadow-xl">
              {client.company_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight text-white mb-1">
                {client.company_name}
              </DialogTitle>
              <div className="flex items-center gap-2 opacity-90">
                <Badge className={`${ClientStatsService.getPlanBadgeColor(client.plan_type)} border-none text-white bg-white/20`}>
                  Plan {ClientStatsService.getPlanDisplayName(client.plan_type)}
                </Badge>
                <span className="text-sm font-medium">• {client.email}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Mensajes', value: client.stats.total_messages, icon: Activity, color: 'text-purple-600' },
              { label: 'Leads Generados', value: client.stats.total_leads, icon: ShieldCheck, color: 'text-blue-600' },
              { label: 'Conversaciones', value: client.stats.total_conversations, icon: Building2, color: 'text-emerald-600' },
              { label: 'Tasa Respuesta', value: `${client.stats.response_rate}%`, icon: Mail, color: 'text-amber-600' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Info */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Desglose por Canales
                </h3>
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

              <ActivitySummary stats={client.stats} />
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Información de Cuenta
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Estado del Servicio</div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${client.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="font-bold text-slate-700">{client.is_active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</div>
                    <div className="font-bold text-slate-700 truncate">{client.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">ID de Usuario</div>
                    <div className="font-mono text-[10px] text-slate-500 break-all">{client.user_id}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
