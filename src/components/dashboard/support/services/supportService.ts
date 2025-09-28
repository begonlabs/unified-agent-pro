import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/lib/supabaseUtils';
import {
  SupportTicket,
  SupportMessage,
  SupportFormData,
  CreateTicketResponse,
  SendMessageResponse,
  User
} from '../types';

export class SupportService {
  /**
   * Fetch all support tickets for a user
   */
  static async fetchTickets(userId: string): Promise<SupportTicket[]> {
    try {
      console.log('🔍 Fetching support tickets for user:', userId);
      
      // Use RPC function to get tickets with message count
      const { data: ticketsData, error } = await supabase
        .rpc('get_user_tickets_with_message_count', { _user_id: userId });

      if (error) {
        throw error;
      }
      
      console.log('📋 Tickets fetched:', ticketsData?.length || 0);
      return ticketsData || [];
      
    } catch (error: unknown) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  /**
   * Fetch messages for a specific ticket
   */
  static async fetchMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      console.log('💬 Fetching messages for ticket:', ticketId);
      
      const { data, error } = await supabase
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
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      
      // Map the data to match the interface
      const mappedMessages: SupportMessage[] = (data || []).map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id || '',
        user_id: msg.user_id,
        message: msg.message,
        message_type: (msg.message_type || 'user') as 'user' | 'admin' | 'system',
        is_read: msg.is_read || false,
        created_at: msg.created_at
      }));
      
      console.log('💬 Messages fetched:', mappedMessages.length);
      return mappedMessages;
      
    } catch (error: unknown) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Create a new support ticket with initial message
   */
  static async createTicket(formData: SupportFormData, user: User): Promise<CreateTicketResponse> {
    try {
      console.log('🎫 Creating support ticket:', formData.subject);
      
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          priority: formData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) {
        throw ticketError;
      }

      // Create initial message
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          user_id: user.id,
          message: formData.message,
          message_type: 'user',
          subject: formData.subject,
          priority: formData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      console.log('✅ Ticket created successfully:', ticketData.id);
      
      // Create a complete SupportTicket object with default values for missing fields
      const completeTicket: SupportTicket = {
        id: ticketData.id,
        subject: ticketData.subject,
        priority: ticketData.priority,
        status: ticketData.status,
        created_at: ticketData.created_at,
        updated_at: ticketData.updated_at,
        message_count: 1, // Initial message
        last_message_at: messageData.created_at,
        unread_count: 0 // User's own message is not unread
      };

      // Create a complete SupportMessage object with proper typing
      const completeMessage: SupportMessage = {
        id: messageData.id,
        ticket_id: messageData.ticket_id,
        user_id: messageData.user_id,
        message: messageData.message,
        message_type: 'user' as const,
        is_read: messageData.is_read || false,
        created_at: messageData.created_at
      };
      
      return {
        ticket: completeTicket,
        message: completeMessage
      };
      
    } catch (error: unknown) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  /**
   * Send a message to an existing ticket
   */
  static async sendMessage(ticketId: string, message: string, user: User): Promise<SendMessageResponse> {
    try {
      console.log('📤 Sending message to ticket:', ticketId);
      
      // First, get the ticket to get subject and priority for the message
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('subject, priority, status')
        .eq('id', ticketId)
        .single();

      if (ticketError) {
        throw ticketError;
      }

      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: message.trim(),
          message_type: 'user',
          subject: ticketData.subject,
          priority: ticketData.priority,
          status: ticketData.status
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      console.log('✅ Message sent successfully:', messageData.id);
      
      // Create a complete SupportMessage object with proper typing
      const completeMessage: SupportMessage = {
        id: messageData.id,
        ticket_id: messageData.ticket_id,
        user_id: messageData.user_id,
        message: messageData.message,
        message_type: 'user' as const,
        is_read: messageData.is_read || false,
        created_at: messageData.created_at
      };
      
      return {
        message: completeMessage
      };
      
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get priority color class
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Get status color class
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'waiting_response': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Format date string to localized format
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get priority display name
   */
  static getPriorityDisplayName(priority: string): string {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baja';
      default: return priority;
    }
  }

  /**
   * Get status display name
   */
  static getStatusDisplayName(status: string): string {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'waiting_response': return 'Esperando Respuesta';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  }

  /**
   * Validate form data
   */
  static validateFormData(formData: SupportFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.subject.trim()) {
      errors.push('El asunto es requerido');
    }

    if (!formData.message.trim()) {
      errors.push('El mensaje es requerido');
    }

    if (formData.subject.length > 200) {
      errors.push('El asunto no puede exceder 200 caracteres');
    }

    if (formData.message.length > 2000) {
      errors.push('El mensaje no puede exceder 2000 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle Supabase errors
   */
  static handleSupabaseError = handleSupabaseError;
}
