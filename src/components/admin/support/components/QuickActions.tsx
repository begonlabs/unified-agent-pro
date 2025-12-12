import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    Eye,
    CheckCircle2,
    UserPlus,
    AlertCircle,
    Tag
} from 'lucide-react';
import { SupportTicket, TicketStatus, TicketPriority } from '../types';

interface QuickActionsProps {
    ticket: SupportTicket;
    onView: (ticket: SupportTicket) => void;
    onAssignToMe: (ticketId: string) => void;
    onStatusChange: (ticketId: string, status: TicketStatus) => void;
    onPriorityChange: (ticketId: string, priority: TicketPriority) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    ticket,
    onView,
    onAssignToMe,
    onStatusChange,
    onPriorityChange
}) => {
    return (
        <div className="flex items-center gap-1">
            {/* View/Reply Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(ticket)}
                className="h-8 px-2"
            >
                <Eye className="h-4 w-4" />
            </Button>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {/* Assign to me */}
                    <DropdownMenuItem onClick={() => onAssignToMe(ticket.id)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Asignarme
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Status changes */}
                    <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                    {ticket.status !== 'in_progress' && (
                        <DropdownMenuItem
                            onClick={() => onStatusChange(ticket.id, 'in_progress')}
                        >
                            <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                            En Progreso
                        </DropdownMenuItem>
                    )}
                    {ticket.status !== 'waiting_response' && (
                        <DropdownMenuItem
                            onClick={() => onStatusChange(ticket.id, 'waiting_response')}
                        >
                            <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                            Esperando Respuesta
                        </DropdownMenuItem>
                    )}
                    {ticket.status !== 'closed' && (
                        <DropdownMenuItem
                            onClick={() => onStatusChange(ticket.id, 'closed')}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Cerrar Ticket
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Priority changes */}
                    <DropdownMenuLabel>Cambiar Prioridad</DropdownMenuLabel>
                    {ticket.priority !== 'urgent' && (
                        <DropdownMenuItem
                            onClick={() => onPriorityChange(ticket.id, 'urgent')}
                        >
                            <Tag className="mr-2 h-4 w-4 text-red-500" />
                            Urgente
                        </DropdownMenuItem>
                    )}
                    {ticket.priority !== 'high' && (
                        <DropdownMenuItem
                            onClick={() => onPriorityChange(ticket.id, 'high')}
                        >
                            <Tag className="mr-2 h-4 w-4 text-orange-500" />
                            Alta
                        </DropdownMenuItem>
                    )}
                    {ticket.priority !== 'normal' && (
                        <DropdownMenuItem
                            onClick={() => onPriorityChange(ticket.id, 'normal')}
                        >
                            <Tag className="mr-2 h-4 w-4 text-blue-500" />
                            Normal
                        </DropdownMenuItem>
                    )}
                    {ticket.priority !== 'low' && (
                        <DropdownMenuItem
                            onClick={() => onPriorityChange(ticket.id, 'low')}
                        >
                            <Tag className="mr-2 h-4 w-4 text-gray-500" />
                            Baja
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
