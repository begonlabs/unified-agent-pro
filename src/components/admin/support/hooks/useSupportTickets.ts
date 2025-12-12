import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { UseSupportTicketsReturn, SupportTicket, TicketStatus, TicketPriority } from '../types';

export const useSupportTickets = (): UseSupportTicketsReturn => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await SupportService.fetchTickets();

      if (response.success) {
        setTickets(response.tickets);
      } else {
        toast({
          title: "Error al cargar tickets",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los tickets de soporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateTicketStatus = useCallback(async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const response = await SupportService.updateTicketStatus(ticketId, newStatus);

      if (response.success) {
        // Update local state
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
              : ticket
          )
        );

        toast({
          title: "Estado actualizado",
          description: `El ticket ha sido marcado como ${SupportService.getStatusDisplayText(newStatus)}.`,
        });
      } else {
        toast({
          title: "Error al actualizar estado",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar el estado del ticket.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateTicketPriority = useCallback(async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const response = await SupportService.updateTicketPriority(ticketId, newPriority);

      if (response.success) {
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, priority: newPriority, updated_at: new Date().toISOString() }
              : ticket
          )
        );

        toast({
          title: "Prioridad actualizada",
          description: `La prioridad del ticket ha sido actualizada a ${SupportService.getPriorityDisplayText(newPriority)}.`,
        });
      } else {
        toast({
          title: "Error al actualizar prioridad",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update ticket priority:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo actualizar la prioridad del ticket.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const assignTicket = useCallback(async (ticketId: string, adminId: string) => {
    try {
      const response = await SupportService.assignTicket(ticketId, adminId);

      if (response.success) {
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, assigned_to: adminId, updated_at: new Date().toISOString() }
              : ticket
          )
        );

        toast({
          title: "Ticket asignado",
          description: "El ticket ha sido asignado exitosamente.",
        });
      } else {
        toast({
          title: "Error al asignar ticket",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo asignar el ticket.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    fetchTickets,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket
  };
};
