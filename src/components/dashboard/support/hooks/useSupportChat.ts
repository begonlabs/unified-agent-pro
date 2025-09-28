import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { User } from '../types';

export const useSupportChat = (user: User | null) => {
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  const updateMessage = useCallback((message: string) => {
    setNewMessage(message);
  }, []);

  const sendMessage = useCallback(async (ticketId: string, onSuccess?: () => void) => {
    if (!user?.id || !newMessage.trim()) {
      return;
    }

    try {
      setSendingMessage(true);
      console.log('📤 Sending message to ticket:', ticketId);
      
      await SupportService.sendMessage(ticketId, newMessage, user);
      
      setNewMessage('');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: unknown) {
      const errorInfo = SupportService.handleSupabaseError(error, "No se pudo enviar el mensaje");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }, [user, newMessage, toast]);

  return {
    newMessage,
    sendingMessage,
    updateMessage,
    sendMessage
  };
};
