import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import {
  SupportTicket,
  SupportMessage,
  SupportStats,
  TicketTrend,
  FetchTicketsResponse,
  FetchMessagesResponse,
  SendMessageResponse,
  UpdateTicketResponse,
  FetchSupportStatsResponse,
  TicketStatus,
  TicketPriority,
  MessageType,
  StatusBadgeColorFunction,
  PriorityBadgeColorFunction
} from '../types';

export class SupportService {
  /**
   * Fetch all support tickets with user profiles and message counts
   */
  static async fetchTickets(): Promise<FetchTicketsResponse> {
    try {
      console.log('🎫 Fetching support tickets...');

      // Get all tickets with basic information
      const { data: ticketsData, error: ticketsError } = await supabaseSelect(
        supabase
          .from('support_tickets')
          .select(`
            id,
            user_id,
            subject,
            priority,
            status,
            created_at,
            updated_at
          `)
          .order('updated_at', { ascending: false })
      );

      if (ticketsError) throw ticketsError;

      // Get user profiles and message counts for each ticket
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('company_name, email')
            .eq('user_id', ticket.user_id)
            .single();

          // Get message counts
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('id, created_at, message_type, is_read')
            .eq('ticket_id', ticket.id);

          const messageCount = messagesData?.length || 0;
          const lastMessageAt = messagesData?.length > 0 
            ? messagesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : ticket.created_at;
          const unreadCount = messagesData?.filter(m => m.message_type !== 'user' && !m.is_read).length || 0;

          return {
            ...ticket,
            priority: ticket.priority as TicketPriority,
            status: ticket.status as TicketStatus,
            message_count: messageCount,
            last_message_at: lastMessageAt,
            unread_count: unreadCount,
            user_profile: profileData ? {
              company_name: profileData.company_name || 'Sin nombre',
              email: profileData.email || 'Sin email'
            } : undefined
          };
        })
      );

      console.log('✅ Support tickets fetched successfully');
      return {
        tickets: ticketsWithProfiles,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching support tickets:', error);
      return {
        tickets: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar tickets de soporte").description
      };
    }
  }

  /**
   * Fetch messages for a specific ticket
   */
  static async fetchMessages(ticketId: string): Promise<FetchMessagesResponse> {
    try {
      console.log(`💬 Fetching messages for ticket ${ticketId}...`);

      const { data, error } = await supabaseSelect(
        supabase
          .from('support_messages')
          .select(`
            id,
            ticket_id,
            user_id,
            message,
            message_type,
            is_read,
            created_at
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
      );

      if (error) throw error;

      const mappedMessages = (data || []).map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id || '',
        user_id: msg.user_id,
        message: msg.message,
        message_type: (msg.message_type || 'user') as MessageType,
        is_read: msg.is_read || false,
        created_at: msg.created_at
      }));

      console.log('✅ Messages fetched successfully');
      return {
        messages: mappedMessages,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching messages:', error);
      return {
        messages: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar mensajes").description
      };
    }
  }

  /**
   * Send a message to a ticket
   */
  static async sendMessage(ticketId: string, message: string, ticket: SupportTicket): Promise<SendMessageResponse> {
    try {
      console.log(`📤 Sending message to ticket ${ticketId}...`);

      const { data: savedMessage, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          user_id: ticket.user_id,
          message: message.trim(),
          message_type: 'admin',
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status
        })
        .select()
        .single();

      if (error) throw error;

      const mappedMessage: SupportMessage = {
        id: savedMessage.id,
        ticket_id: savedMessage.ticket_id || '',
        user_id: savedMessage.user_id,
        message: savedMessage.message,
        message_type: savedMessage.message_type as MessageType,
        is_read: savedMessage.is_read || false,
        created_at: savedMessage.created_at
      };

      console.log('✅ Message sent successfully');
      return {
        message: mappedMessage,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error sending message:', error);
      return {
        message: {
          id: '',
          ticket_id: '',
          user_id: '',
          message: '',
          message_type: 'admin',
          is_read: false,
          created_at: ''
        },
        success: false,
        error: handleSupabaseError(error, "Error al enviar mensaje").description
      };
    }
  }

  /**
   * Update ticket status
   */
  static async updateTicketStatus(ticketId: string, newStatus: TicketStatus): Promise<UpdateTicketResponse> {
    try {
      console.log(`🔄 Updating ticket ${ticketId} status to ${newStatus}...`);

      const { data: updatedTicket, error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Ticket status updated successfully');
      
      // Map the updated ticket to our SupportTicket interface
      const mappedTicket: SupportTicket = {
        id: updatedTicket.id,
        user_id: updatedTicket.user_id,
        subject: updatedTicket.subject,
        priority: updatedTicket.priority as TicketPriority,
        status: updatedTicket.status as TicketStatus,
        created_at: updatedTicket.created_at,
        updated_at: updatedTicket.updated_at,
        message_count: 0, // Will be updated by the calling component
        last_message_at: updatedTicket.updated_at,
        unread_count: 0 // Will be updated by the calling component
      };
      
      return {
        ticket: mappedTicket,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error updating ticket status:', error);
      return {
        ticket: {} as SupportTicket,
        success: false,
        error: handleSupabaseError(error, "Error al actualizar estado del ticket").description
      };
    }
  }

  /**
   * Fetch support statistics
   */
  static async fetchSupportStats(): Promise<FetchSupportStatsResponse> {
    try {
      console.log('📊 Fetching support statistics...');

      // For now, return mock data until we have real statistics
      // TODO: Implement real statistics when support_tickets table is properly set up
      const mockStats: SupportStats = {
        totalTickets: 156,
        openTickets: 23,
        inProgressTickets: 12,
        closedTickets: 121,
        avgResponseTime: 2.5, // hours
        satisfactionRate: 4.2, // out of 5
        ticketsThisWeek: 18,
        ticketsThisMonth: 67
      };

      const mockTrends: TicketTrend[] = [
        { date: '2024-01-01', open: 15, closed: 12 },
        { date: '2024-01-02', open: 18, closed: 14 },
        { date: '2024-01-03', open: 22, closed: 16 },
        { date: '2024-01-04', open: 19, closed: 18 },
        { date: '2024-01-05', open: 25, closed: 20 },
        { date: '2024-01-06', open: 23, closed: 22 },
        { date: '2024-01-07', open: 20, closed: 19 }
      ];

      console.log('✅ Support statistics fetched successfully');
      return {
        stats: mockStats,
        trends: mockTrends,
        success: true
      };

    } catch (error: unknown) {
      console.error('❌ Error fetching support statistics:', error);
      return {
        stats: {
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          closedTickets: 0,
          avgResponseTime: 0,
          satisfactionRate: 0,
          ticketsThisWeek: 0,
          ticketsThisMonth: 0
        },
        trends: [],
        success: false,
        error: handleSupabaseError(error, "Error al cargar estadísticas de soporte").description
      };
    }
  }

  /**
   * Get status badge color
   */
  static getStatusBadgeColor: StatusBadgeColorFunction = (status: TicketStatus) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_response: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800'
    };
    return colors[status];
  };

  /**
   * Get priority badge color
   */
  static getPriorityBadgeColor: PriorityBadgeColorFunction = (priority: TicketPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  /**
   * Get status display text
   */
  static getStatusDisplayText(status: TicketStatus): string {
    const texts = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      waiting_response: 'Esperando Respuesta',
      closed: 'Cerrado'
    };
    return texts[status];
  }

  /**
   * Get priority display text
   */
  static getPriorityDisplayText(priority: TicketPriority): string {
    const texts = {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return texts[priority];
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format date for table display
   */
  static formatTableDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  /**
   * Filter tickets based on criteria
   */
  static filterTickets(
    tickets: SupportTicket[],
    statusFilter: string,
    priorityFilter: string,
    searchTerm: string
  ): SupportTicket[] {
    return tickets.filter(ticket => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesSearch = searchTerm === '' || 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_profile?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_profile?.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
