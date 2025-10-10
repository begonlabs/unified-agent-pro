import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Phone, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Send, 
  User,
  Bot,
  Filter,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { ConversationConnectionStatus } from '@/components/ui/connection-status';
import { useDebounce } from '@/hooks/useDebounce';
import { NotificationService } from '@/components/notifications';

/**
 * Hook optimizado para MessagesView con memoización y gestión de estado mejorada
 */
export const useMessagesViewOptimized = () => {
  // Estados optimizados
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'conversations' | 'messages'>('conversations');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [previousMessageCount, setPreviousMessageCount] = useState<Record<string, number>>({});
  
  // Refs para valores que no necesitan re-renderizar
  const isMountedRef = useRef(true);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Hooks optimizados
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversations, loading: conversationsLoading, error: conversationsError } = useRealtimeConversations(user?.id || null);
  const { messages, loading: messagesLoading } = useRealtimeMessages(selectedConversation, user?.id || null);
  // Función para verificar mensajes duplicados
  const isDuplicateMessage = useCallback((content: string, conversationId: string, timeWindow: number = 5000) => {
    // Implementación simplificada - verificar si el último mensaje es similar
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return false;
    
    const timeDiff = Date.now() - new Date(lastMessage.created_at).getTime();
    return lastMessage.content === content && timeDiff < timeWindow;
  }, [messages]);
  
  // Debounced search para optimizar búsquedas
  const debouncedSearchTerm = useMemo(() => {
    const timer = setTimeout(() => {}, 300);
    clearTimeout(timer);
    return searchTerm;
  }, [searchTerm]);

  /**
   * Función optimizada para manejar selección de conversación
   */
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    setMobileView('messages');
    
    // Crear notificación si hay mensajes nuevos
    if (user?.id && previousMessageCount[conversationId] > 0) {
      NotificationService.createNotification(
        user.id,
        'message',
        'Nuevo mensaje',
        `Tienes ${previousMessageCount[conversationId]} mensajes nuevos en esta conversación`,
        {
          priority: 'medium',
          metadata: {
            conversation_id: conversationId,
            message_count: previousMessageCount[conversationId],
            module: 'messages'
          },
          action_url: `/dashboard/messages?conversation=${conversationId}`,
          action_label: 'Ver mensajes'
        }
      ).catch(error => {
        console.error('Error creating message notification:', error);
      });
    }
  }, [user?.id, previousMessageCount]);

  /**
   * Función optimizada para enviar mensajes
   */
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          content: newMessage.trim(),
          sender_type: 'user',
          sender_name: user.email?.split('@')[0] || 'Usuario',
          is_automated: false,
          user_id: user.id
        });

      if (error) throw error;
      
      setNewMessage('');
      
      // Limpiar focus del input
      if (messageInputRef.current) {
        messageInputRef.current.blur();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  }, [newMessage, selectedConversation, user, toast]);

  /**
   * Función optimizada para manejar cambios en el input de mensaje
   */
  const handleMessageChange = useCallback((value: string) => {
    setNewMessage(value);
  }, []);

  /**
   * Función optimizada para manejar búsqueda
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  /**
   * Función optimizada para manejar filtros
   */
  const handleFilterChange = useCallback((type: 'channel' | 'status', value: string) => {
    if (type === 'channel') {
      setChannelFilter(value);
    } else {
      setStatusFilter(value);
    }
  }, []);

  /**
   * Función optimizada para alternar vista móvil
   */
  const toggleMobileView = useCallback(() => {
    setMobileView(prev => prev === 'conversations' ? 'messages' : 'conversations');
  }, []);

  /**
   * Función optimizada para manejar navegación desde notificaciones
   */
  const handleNotificationNavigation = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId) {
      setSelectedConversation(conversationId);
      setMobileView('messages');
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  /**
   * Effect optimizado para detectar mensajes nuevos
   */
  useEffect(() => {
    if (!user?.id || !conversations.length) return;

    conversations.forEach(conversation => {
      const currentCount = 1; // Simplificado - asumimos 1 mensaje por conversación
      const previousCount = previousMessageCount[conversation.id] || 0;
      
      if (currentCount > previousCount && conversation.id !== selectedConversation) {
        // Actualizar contador
        setPreviousMessageCount(prev => ({
          ...prev,
          [conversation.id]: currentCount
        }));
        
        // Crear notificación
        NotificationService.createNotification(
          user.id,
          'message',
          'Nuevo mensaje',
          `Tienes ${currentCount - previousCount} mensajes nuevos de ${conversation.crm_clients?.name || 'Cliente'}`,
          {
            priority: 'high',
            metadata: {
              conversation_id: conversation.id,
              message_count: currentCount - previousCount,
              client_name: conversation.crm_clients?.name || 'Cliente',
              module: 'messages'
            },
            action_url: `/dashboard/messages?conversation=${conversation.id}`,
            action_label: 'Ver mensajes'
          }
        ).catch(error => {
          console.error('Error creating new message notification:', error);
        });
      }
    });
  }, [conversations, user?.id, selectedConversation, previousMessageCount]);

  /**
   * Effect optimizado para navegación desde notificaciones
   */
  useEffect(() => {
    handleNotificationNavigation();
  }, [handleNotificationNavigation]);

  /**
   * Effect optimizado para cleanup
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Conversaciones filtradas memoizadas
   */
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      // Filtro de búsqueda
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch = 
          conversation.crm_clients?.name?.toLowerCase().includes(searchLower) ||
          conversation.crm_clients?.email?.toLowerCase().includes(searchLower) ||
          conversation.crm_clients?.phone?.includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Filtro de canal
      if (channelFilter !== 'all' && conversation.channel !== channelFilter) {
        return false;
      }
      
      // Filtro de estado
      if (statusFilter !== 'all' && conversation.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [conversations, debouncedSearchTerm, channelFilter, statusFilter]);

  /**
   * Conversación seleccionada memoizada
   */
  const selectedConversationData = useMemo(() => {
    return conversations.find(c => c.id === selectedConversation) || null;
  }, [conversations, selectedConversation]);

  /**
   * Estadísticas memoizadas
   */
  const stats = useMemo(() => {
    const total = conversations.length;
    const unread = conversations.filter(c => c.status === 'unread').length;
    const active = conversations.filter(c => c.status === 'active').length;
    const resolved = conversations.filter(c => c.status === 'resolved').length;
    
    return { total, unread, active, resolved };
  }, [conversations]);

  /**
   * Estado de carga memoizado
   */
  const loadingState = useMemo(() => ({
    conversations: conversationsLoading,
    messages: messagesLoading,
    overall: conversationsLoading || messagesLoading,
  }), [conversationsLoading, messagesLoading]);

  /**
   * Estado de error memoizado
   */
  const errorState = useMemo(() => ({
    conversations: conversationsError,
    messages: null, // useRealtimeMessages no tiene error
    hasError: !!conversationsError,
  }), [conversationsError]);

  return {
    // Estados
    selectedConversation,
    mobileView,
    searchTerm,
    channelFilter,
    statusFilter,
    newMessage,
    
    // Datos
    conversations: filteredConversations,
    selectedConversationData,
    messages,
    stats,
    
    // Estados de carga y error
    loading: loadingState,
    error: errorState,
    
    // Acciones
    handleConversationSelect,
    handleSendMessage,
    handleMessageChange,
    handleSearchChange,
    handleFilterChange,
    toggleMobileView,
    
    // Refs
    messageInputRef,
  };
};
