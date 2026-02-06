import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActivitySummaryProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';
import { MessageSquare, Users, MessageCircle, BarChart2 } from 'lucide-react';

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({ stats }) => {
  const summaryItems = [
    { label: 'Mensajes Totales', value: ClientStatsService.formatNumber(stats.total_messages), icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Leads Capturados', value: ClientStatsService.formatNumber(stats.total_leads), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversaciones', value: ClientStatsService.formatNumber(stats.total_conversations), icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tasa Respuesta', value: ClientStatsService.formatResponseRate(stats.response_rate), icon: BarChart2, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <BarChart2 className="h-4 w-4" /> Resumen Global de Actividad
      </h3>
      <div className="grid gap-4 md:grid-cols-4">
        {summaryItems.map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-0 flex flex-col items-center">
              <div className={`w-full ${item.bg} flex justify-center py-6 transition-all group-hover:py-8`}>
                <item.icon className={`h-8 w-8 ${item.color} shadow-sm`} />
              </div>
              <div className="py-4 px-2 text-center">
                <div className="text-xl font-black text-slate-800 tracking-tighter">
                  {item.value}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {item.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};