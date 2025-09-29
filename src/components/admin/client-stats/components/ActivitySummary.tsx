import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivitySummaryProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen de Actividad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 bg-gradient-to-br from-[#3a0caa]/10 to-[#710db2]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#3a0caa]">
              {ClientStatsService.formatNumber(stats.total_messages)}
            </div>
            <div className="text-sm text-gray-500">Total Mensajes</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-[#710db2]/10 to-[#3a0caa]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#710db2]">
              {ClientStatsService.formatNumber(stats.total_leads)}
            </div>
            <div className="text-sm text-gray-500">Total Leads</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-[#3a0caa]/10 to-[#710db2]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#3a0caa]">
              {ClientStatsService.formatNumber(stats.total_conversations)}
            </div>
            <div className="text-sm text-gray-500">Conversaciones</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-[#710db2]/10 to-[#3a0caa]/10 rounded-lg">
            <div className="text-2xl font-bold text-[#710db2]">
              {ClientStatsService.formatResponseRate(stats.response_rate)}
            </div>
            <div className="text-sm text-gray-500">Tasa Respuesta</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};