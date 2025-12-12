import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { UseSupportTicketsReturn, SupportTicket, TicketStatus } from '../types';

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

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    fetchTickets,
    updateTicketStatus
  };
};
