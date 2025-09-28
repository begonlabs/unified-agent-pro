import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { TicketCardProps } from '../types';

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  getPriorityColor,
  getStatusColor,
  formatDate
}) => (
  <div
    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-medium text-sm">{ticket.subject}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
          {ticket.unread_count > 0 && (
            <Badge variant="destructive">
              {ticket.unread_count} nuevo{ticket.unread_count > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {ticket.message_count} mensaje{ticket.message_count !== 1 ? 's' : ''} • 
          {formatDate(ticket.last_message_at || ticket.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <Clock className="h-4 w-4" />
      </div>
    </div>
  </div>
);
