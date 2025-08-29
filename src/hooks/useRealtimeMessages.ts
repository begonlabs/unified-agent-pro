import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_name?: string;
  is_automated: boolean;
  created_at: string;
  conversation_id: string;
  platform_message_id?: string;
  metadata?: Record<string, unknown>;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  loading: boolean;
  isConnected: boolean;
  refreshMessages: () => Promise<void>;
  sendOptimisticMessage: (message: Omit<Message, 'id' | 'created_at'>) => string;
  updateMessageStatus: (tempId: string, savedMessage: Message) => void;
}

export const useRealtimeMessages = (
  conversationId: string | null,
  userId: string | null
): UseRealtimeMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const optimisticMessagesRef = useRef<Map<string, Message>>(new Map());

  // Función para obtener mensajes iniciales
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching messages for conversation:', conversationId);

      // Verificar que la conversación pertenece al usuario
      const { data: conversationCheck } = await supabase
        .from('conversations')
        .select('user_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!conversationCheck) {
        console.error('❌ Conversation does not belong to user');
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('💬 Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error: unknown) {
      console.error('❌ Error fetching messages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, toast]);

  // Función para manejar cambios en tiempo real
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<Message>) => {
    const eventType = payload.eventType;
    const newData = payload.new as Message;
    const oldData = payload.old;

    console.log('🔄 Realtime message change:', eventType, newData?.id);

    // Solo procesar mensajes de la conversación actual
    if (newData?.conversation_id !== conversationId) {
      return;
    }

    setMessages(prevMessages => {
      switch (eventType) {
        case 'INSERT': {
          // Verificar si es un mensaje optimista que ya tenemos
          const isOptimistic = Array.from(optimisticMessagesRef.current.values())
            .some(optMsg => optMsg.content === newData.content && 
                           optMsg.sender_type === newData.sender_type &&
                           Math.abs(new Date(optMsg.created_at).getTime() - new Date(newData.created_at).getTime()) < 5000
            );

          if (isOptimistic) {
            // Reemplazar mensaje optimista con el real
            const optimisticEntries = Array.from(optimisticMessagesRef.current.entries());
            const [tempId] = optimisticEntries.find(([_, optMsg]) => 
              optMsg.content === newData.content && optMsg.sender_type === newData.sender_type
            ) || [''];

            if (tempId) {
              optimisticMessagesRef.current.delete(tempId);
              return prevMessages.map(msg => 
                msg.id === tempId ? newData : msg
              );
            }
          }

          // Evitar duplicados por ID
          const existsById = prevMessages.some(msg => msg.id === newData.id);
          if (existsById) {
            console.log('🔄 Message already exists by ID:', newData.id);
            return prevMessages;
          }

          // Evitar duplicados por contenido (anti-spam)
          const duplicateByContent = prevMessages.find(msg => {
            const timeDiff = Math.abs(
              new Date(msg.created_at).getTime() - new Date(newData.created_at).getTime()
            );
            return msg.content === newData.content &&
                   msg.sender_type === newData.sender_type &&
                   timeDiff < 3000; // 3 segundos
          });

          if (duplicateByContent) {
            console.log('🚫 Duplicate content detected, ignoring:', {
              content: newData.content.substring(0, 30) + '...',
              existingId: duplicateByContent.id,
              newId: newData.id,
              timeDiff: Math.abs(
                new Date(duplicateByContent.created_at).getTime() - 
                new Date(newData.created_at).getTime()
              )
            });
            return prevMessages;
          }

          console.log('➕ Adding new message:', newData.id);
          return [...prevMessages, newData].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }

        case 'UPDATE': {
          console.log('🔄 Updating message:', newData.id);
          return prevMessages.map(msg => 
            msg.id === newData.id ? { ...msg, ...newData } : msg
          );
        }

        case 'DELETE': {
          const deletedId = (oldData as Message)?.id;
          console.log('🗑️ Removing message:', deletedId);
          return prevMessages.filter(msg => msg.id !== deletedId);
        }

        default:
          return prevMessages;
      }
    });

    // Mostrar notificación para mensajes nuevos (solo de clientes)
    if (eventType === 'INSERT' && newData.sender_type === 'client') {
      toast({
        title: "Nuevo mensaje",
        description: newData.content.substring(0, 50) + (newData.content.length > 50 ? '...' : ''),
      });
    }
  }, [conversationId, toast]);

  // Función para configurar suscripción realtime
  const setupRealtimeSubscription = useCallback(() => {
    if (!conversationId || channelRef.current) {
      return;
    }

    console.log('🔌 Setting up messages realtime subscription for conversation:', conversationId);

    try {
      const channel = supabase
        .channel(`messages:conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          handleRealtimeChange
        )
        .subscribe((status) => {
          console.log('📡 Messages subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Error setting up messages realtime:', error);
      setIsConnected(false);
    }
  }, [conversationId, handleRealtimeChange]);

  // Función para limpiar suscripción
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up messages subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Función para enviar mensaje optimista (UI instantáneo) con anti-duplicados
  const sendOptimisticMessage = useCallback((messageData: Omit<Message, 'id' | 'created_at'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    // Verificar duplicados recientes (2 segundos)
    const recentOptimistic = Array.from(optimisticMessagesRef.current.values())
      .filter(msg => {
        const msgTime = new Date(msg.created_at).getTime();
        return (now - msgTime) < 2000 &&
               msg.content === messageData.content &&
               msg.conversation_id === messageData.conversation_id;
      });

    if (recentOptimistic.length > 0) {
      console.log('🚫 Mensaje optimista duplicado detectado, ignorando:', {
        content: messageData.content.substring(0, 30) + '...',
        duplicatesFound: recentOptimistic.length
      });
      return tempId; // Retornar ID para mantener compatibilidad
    }

    const optimisticMessage: Message = {
      ...messageData,
      id: tempId,
      created_at: new Date().toISOString()
    };

    // Guardar en ref para rastreo
    optimisticMessagesRef.current.set(tempId, optimisticMessage);

    // Agregar inmediatamente a la UI
    setMessages(prev => {
      // Verificación adicional en el estado actual
      const existingRecent = prev.find(msg => {
        const msgTime = new Date(msg.created_at).getTime();
        return (now - msgTime) < 2000 &&
               msg.content === messageData.content &&
               msg.conversation_id === messageData.conversation_id;
      });

      if (existingRecent) {
        console.log('🚫 Mensaje duplicado en estado actual, ignorando');
        return prev;
      }

      return [...prev, optimisticMessage];
    });

    console.log('⚡ Optimistic message added:', tempId);
    return tempId;
  }, []);

  // Función para actualizar estado del mensaje
  const updateMessageStatus = useCallback((tempId: string, savedMessage: Message) => {
    optimisticMessagesRef.current.delete(tempId);
    
    setMessages(prev => 
      prev.map(msg => msg.id === tempId ? savedMessage : msg)
    );

    console.log('✅ Message status updated:', tempId, '→', savedMessage.id);
  }, []);

  // Función pública para refrescar mensajes
  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // Effect principal
  useEffect(() => {
    if (!conversationId || !userId) {
      cleanupSubscription();
      setMessages([]);
      optimisticMessagesRef.current.clear();
      return;
    }

    // Cargar mensajes iniciales
    fetchMessages();

    // Configurar suscripción realtime
    setupRealtimeSubscription();

    // Cleanup al desmontar o cambiar conversación
    return () => {
      cleanupSubscription();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      optimisticMessagesRef.current.clear();
    };
  }, [conversationId, userId, fetchMessages, setupRealtimeSubscription, cleanupSubscription]);

  return {
    messages,
    loading,
    isConnected,
    refreshMessages,
    sendOptimisticMessage,
    updateMessageStatus
  };
};
