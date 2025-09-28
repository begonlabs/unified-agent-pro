import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { TicketListProps } from '../types';
import { TicketCard } from './TicketCard';

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  loading,
  onTicketSelect,
  getPriorityColor,
  getStatusColor,
  formatDate
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Mis Consultas</span>
      </CardTitle>
      <CardDescription>
        Revisa el estado de tus consultas anteriores
      </CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tienes consultas aún</p>
          <p className="text-sm">Crea tu primera consulta usando el formulario</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketSelect(ticket)}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
