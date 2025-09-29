import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketTrendsProps } from '../types';

export const TicketTrends: React.FC<TicketTrendsProps> = ({ trends }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencias de la Semana</CardTitle>
        <CardDescription>
          Tickets abiertos vs cerrados en los últimos 7 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="text-sm font-medium">
                {new Date(trend.date).toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">{trend.open}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">{trend.closed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
