import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';
import { TicketTableProps } from '../types';
import { SupportService } from '../services/supportService';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  loading,
  onTicketSelect,
  onStatusUpdate,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Asunto</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Mensajes</TableHead>
            <TableHead>Última Actividad</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{ticket.user_profile?.company_name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {ticket.user_profile?.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <div className="font-medium truncate">{ticket.subject}</div>
                  {ticket.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      {ticket.unread_count} nuevo{ticket.unread_count > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <PriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {ticket.message_count} mensaje{ticket.message_count !== 1 ? 's' : ''}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {SupportService.formatTableDate(ticket.last_message_at || ticket.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTicketSelect(ticket)}
                  >
                    Ver Chat
                  </Button>
                  {ticket.status !== 'closed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusUpdate(
                        ticket.id,
                        ticket.status === 'open' ? 'in_progress' : 'closed'
                      )}
                    >
                      {ticket.status === 'open' ? 'Tomar' : 'Cerrar'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
