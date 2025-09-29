import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { UseSupportMessagesReturn, SupportMessage, SupportTicket } from '../types';

export const useSupportMessages = (): UseSupportMessagesReturn => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      const response = await SupportService.fetchMessages(ticketId);

      if (response.success) {
        setMessages(response.messages);
      } else {
        toast({
          title: "Error al cargar mensajes",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch support messages:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudieron cargar los mensajes.",
        variant: "destructive",
      });
      
      return {
        messages: [],
        success: false,
        error: "Error inesperado al cargar mensajes"
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const sendMessage = useCallback(async (ticketId: string, message: string, ticket: SupportTicket) => {
    if (!message.trim()) {
      return {
        message: {
          id: '',
          ticket_id: '',
          user_id: '',
          message: '',
          message_type: 'admin' as const,
          is_read: false,
          created_at: ''
        },
        success: false,
        error: "Mensaje vacío"
      };
    }

    const messageText = message.trim();
    
    try {
      // Create optimistic message (appears immediately in UI)
      const optimisticMessage: SupportMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        ticket_id: ticketId,
        user_id: ticket.user_id,
        message: messageText,
        message_type: 'admin',
        is_read: false,
        created_at: new Date().toISOString()
      };

      // Add optimistic message to local list
      setMessages(prev => [...prev, optimisticMessage]);

      // Send real message to database
      const response = await SupportService.sendMessage(ticketId, messageText, ticket);

      if (response.success) {
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? response.message
              : msg
          )
        );

        toast({
          title: "Respuesta enviada",
          description: "La respuesta ha sido enviada al cliente.",
        });
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        toast({
          title: "Error al enviar respuesta",
          description: response.error || "Error desconocido",
          variant: "destructive",
        });
      }
      
      return response;
      
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      
      console.error('Failed to send message:', error);
      toast({
        title: "Error inesperado",
        description: "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
      
      return {
        message: {
          id: '',
          ticket_id: '',
          user_id: '',
          message: '',
          message_type: 'admin' as const,
          is_read: false,
          created_at: ''
        },
        success: false,
        error: "Error inesperado al enviar mensaje"
      };
    }
  }, [toast]);

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage
  };
};
