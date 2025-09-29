import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoWhite from '@/assets/logo_white.png';
import { TicketDistributionProps } from '../types';
import { SupportService } from '../services/supportService';

export const TicketDistribution: React.FC<TicketDistributionProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Distribución de Tickets</span>
        </CardTitle>
        <CardDescription>
          Estado actual de todos los tickets de soporte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Abiertos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{stats.openTickets}</span>
              <Badge variant="outline" className="text-xs">
                {SupportService.calculatePercentage(stats.openTickets, stats.totalTickets)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{stats.inProgressTickets}</span>
              <Badge variant="outline" className="text-xs">
                {SupportService.calculatePercentage(stats.inProgressTickets, stats.totalTickets)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Resueltos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{stats.closedTickets}</span>
              <Badge variant="outline" className="text-xs">
                {SupportService.calculatePercentage(stats.closedTickets, stats.totalTickets)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
