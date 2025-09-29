import { useState, useCallback } from 'react';
import { SupportTicket, SupportMessage, ChatState } from '../types';

export const useChatState = () => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [response, setResponse] = useState('');

  const openChat = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setResponse('');
  }, []);

  const closeChat = useCallback(() => {
    setSelectedTicket(null);
    setMessages([]);
    setResponse('');
  }, []);

  const updateMessages = useCallback((newMessages: SupportMessage[]) => {
    setMessages(newMessages);
  }, []);

  const addMessage = useCallback((message: SupportMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingMessages(loading);
  }, []);

  const clearResponse = useCallback(() => {
    setResponse('');
  }, []);

  return {
    selectedTicket,
    messages,
    loadingMessages,
    response,
    openChat,
    closeChat,
    updateMessages,
    addMessage,
    setLoading,
    setResponse,
    clearResponse
  };
};
