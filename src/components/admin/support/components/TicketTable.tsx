import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Clock
} from 'lucide-react';
import { TicketTableProps, SupportTicket, SortConfig } from '../types';
import { SupportService } from '../services/supportService';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { QuickActions } from './QuickActions';

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  loading,
  onTicketSelect,
  onStatusUpdate,
  onRefresh,
  selectedTickets = new Set(),
  onToggleSelect,
  onSelectAll,
  sortConfig,
  onSort,
  onAssignToMe,
  onPriorityUpdate
}) => {
  const handleSort = (field: keyof SupportTicket) => {
    if (!onSort) return;

    const direction =
      sortConfig?.field === field && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';

    onSort({ field, direction });
  };

  const renderSortIcon = (field: keyof SupportTicket) => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 text-primary" />
      : <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked ? tickets.map(t => t.id) : []);
    }
  };

  const allSelected = tickets.length > 0 && selectedTickets.size === tickets.length;
  const someSelected = selectedTickets.size > 0 && selectedTickets.size < tickets.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-md bg-gray-50/50">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No se encontraron tickets</h3>
        <p className="text-gray-500 mt-1 max-w-sm">
          No hay tickets que coincidan con tus filtros actuales. Intenta cambiar los filtros o limpiar la búsqueda.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onRefresh}
        >
          Refrescar
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            {onToggleSelect && (
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos"
                  className={someSelected ? "opacity-50" : ""}
                />
              </TableHead>
            )}

            <TableHead
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort('user_id')}
            >
              <div className="flex items-center">
                Cliente
                {renderSortIcon('user_id')}
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort('subject')}
            >
              <div className="flex items-center">
                Asunto
                {renderSortIcon('subject')}
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center">
                Prioridad
                {renderSortIcon('priority')}
              </div>
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Estado
                {renderSortIcon('status')}
              </div>
            </TableHead>

            <TableHead>Mensajes</TableHead>

            <TableHead
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleSort('updated_at')}
            >
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Actualizado
                {renderSortIcon('updated_at')}
              </div>
            </TableHead>

            <TableHead className="text-right pr-4">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const isSelected = selectedTickets.has(ticket.id);

            return (
              <TableRow
                key={ticket.id}
                className={`
                  group transition-colors
                  ${isSelected ? 'bg-primary/5 data-[state=selected]:bg-primary/5' : 'hover:bg-gray-50'}
                  ${ticket.status === 'closed' ? 'opacity-75 bg-gray-50/50' : ''}
                  ${ticket.priority === 'urgent' && ticket.status !== 'closed' ? 'bg-red-50/30' : ''}
                `}
                data-state={isSelected ? "selected" : undefined}
                onClick={(e) => {
                  // Don't trigger row click if clicking checkbox or actions
                  if (
                    (e.target as HTMLElement).closest('.checkbox-area') ||
                    (e.target as HTMLElement).closest('.actions-area')
                  ) {
                    return;
                  }
                  onTicketSelect(ticket);
                }}
              >
                {onToggleSelect && (
                  <TableCell className="pl-4 checkbox-area">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(ticket.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleccionar ticket ${ticket.id}`}
                    />
                  </TableCell>
                )}

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {ticket.user_profile?.company_name || 'Sin empresa'}
                    </span>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <User className="h-3 w-3 mr-1" />
                      {ticket.user_profile?.email || 'Sin email'}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="max-w-[200px] sm:max-w-[300px]">
                    <div className="font-medium truncate text-gray-900">
                      {ticket.subject}
                    </div>
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ticket.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{ticket.tags.length - 2}
                          </span>
                        )}
                      </div>
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
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      {ticket.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-1 ring-white">
                          {ticket.unread_count}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {ticket.message_count}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-900">
                      {SupportService.formatTableDate(ticket.last_message_at || ticket.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.last_message_at || ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right pr-4 actions-area">
                  <div onClick={(e) => e.stopPropagation()}>
                    <QuickActions
                      ticket={ticket}
                      onView={() => onTicketSelect(ticket)}
                      onAssignToMe={(id) => onAssignToMe?.(id)}
                      onStatusChange={(id, status) => onStatusUpdate(id, status)}
                      onPriorityChange={(id, priority) => onPriorityUpdate?.(id, priority)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
