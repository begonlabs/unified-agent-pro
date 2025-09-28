import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { SupportMessage, User } from '../types';

export const useSupportMessages = (user: User | null) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async (ticketId: string) => {
    if (!user?.id || !ticketId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('💬 Fetching messages for ticket:', ticketId);
      
      const fetchedMessages = await SupportService.fetchMessages(ticketId);
      setMessages(fetchedMessages);
      
    } catch (error: unknown) {
      const errorInfo = SupportService.handleSupabaseError(error, "No se pudieron cargar los mensajes");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  return { 
    messages, 
    setMessages,
    loading, 
    fetchMessages 
  };
};
