import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Conversation {
  id: string;
  channel: string;
  client_id?: string;
  last_message_at: string;
  status: string;
  channel_thread_id?: string;
  created_at: string;
  user_id: string;
  ai_enabled: boolean | null;
  crm_clients?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    avatar_url?: string;
  };
}

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

interface UseRealtimeConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  connectionStatus: ConnectionStatus;
  refreshConversations: () => Promise<void>;
  error: string | null;
}

export const useRealtimeConversations = (userId: string | null): UseRealtimeConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });

  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Función para obtener conversaciones iniciales
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching conversations for user:', userId);

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          crm_clients (
            id,
            name,
            email,
            phone,
            status,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('💬 Conversations loaded:', data?.length || 0);
      setConversations(data || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching conversations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error loading conversations';
      setError(errorMessage);

      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Función para manejar cambios en tiempo real
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    console.log('🔄 Realtime conversation change:', payload.eventType, (payload.new as Conversation)?.id);

    setConversations(prevConversations => {
      switch (payload.eventType) {
        case 'INSERT': {
          const newConversation = payload.new as unknown as Conversation;

          // Verificar que la conversación pertenece al usuario actual
          if (newConversation.user_id !== userId) {
            return prevConversations;
          }

          // Evitar duplicados
          const exists = prevConversations.some(conv => conv.id === newConversation.id);
          if (exists) {
            return prevConversations;
          }

          console.log('➕ Adding new conversation:', newConversation.id);
          return [newConversation, ...prevConversations];
        }

        case 'UPDATE': {
          const updatedConversation = payload.new as unknown as Conversation;

          if (updatedConversation.user_id !== userId) {
            return prevConversations;
          }

          console.log('🔄 Updating conversation:', updatedConversation.id);
          return prevConversations.map(conv =>
            conv.id === updatedConversation.id
              ? { ...conv, ...updatedConversation }
              : conv
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        }

        case 'DELETE': {
          const deletedId = payload.old?.id;
          console.log('Removing conversation:', deletedId);
          return prevConversations.filter(conv => conv.id !== deletedId);
        }

        default:
          return prevConversations;
      }
    });
  }, [userId]);

  // Función para limpiar suscripciones
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up realtime subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionStatus({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    });
  }, []);

  // Función para establecer suscripción realtime (con prevención de duplicados)
  const setupRealtimeSubscription = useCallback(() => {
    // Verificar condiciones previas
    if (!userId) {
      console.log('🚫 No userId provided for realtime subscription');
      return;
    }

    // Evitar múltiples suscripciones
    if (channelRef.current) {
      // Realtime subscription already exists, skipping setup
      return;
    }

    setConnectionStatus(prev => ({ ...prev, isConnecting: true }));

    try {
      console.log('🔌 Setting up realtime subscription for user:', userId);

      // Crear canal con nombre único basado en timestamp para evitar colisiones
      const channelName = `conversations:user:${userId}:${Date.now()}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `user_id=eq.${userId}` // Filtro específico por usuario
          },
          (payload) => {
            console.log('📡 Conversations realtime event:', payload.eventType, payload.new);
            handleRealtimeChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 Conversations subscription status:', status);

          if (status === 'SUBSCRIBED') {
            setConnectionStatus({
              isConnected: true,
              isConnecting: false,
              lastConnected: new Date(),
              reconnectAttempts: 0
            });

            // Conexión establecida - no mostrar notificación innecesaria
          } else if (status === 'CLOSED') {
            setConnectionStatus(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false
            }));

            // Limpiar referencia del canal
            if (channelRef.current === channel) {
              channelRef.current = null;
            }

            // Intentar reconectar automáticamente con delay
            setTimeout(() => {
              cleanupSubscription();
              setTimeout(() => {
                setupRealtimeSubscription();
              }, 2000);
            }, 1000);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error, cleaning up and retrying');
            setConnectionStatus(prev => ({
              ...prev,
              isConnected: false,
              isConnecting: false
            }));

            // Limpiar referencia del canal
            if (channelRef.current === channel) {
              channelRef.current = null;
            }
          }
        });

      channelRef.current = channel;
      // Realtime subscription established

    } catch (error) {
      console.error('Error setting up realtime:', error);
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: false
      }));

      // Limpiar en caso de error
      channelRef.current = null;
    }
  }, [userId, handleRealtimeChange, toast, cleanupSubscription]);

  // Función para intentar reconectar
  const attemptReconnect = useCallback(() => {
    setConnectionStatus(prev => {
      if (prev.reconnectAttempts >= maxReconnectAttempts) {
        toast({
          title: "Conexión perdida",
          description: "No se pudo reconectar automáticamente. Recarga la página.",
          variant: "destructive",
        });
        return prev;
      }

      const newAttempts = prev.reconnectAttempts + 1;
      console.log(`🔄 Reconnect attempt ${newAttempts}/${maxReconnectAttempts}`);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
        setupRealtimeSubscription();
      }, reconnectDelay * newAttempts); // Backoff exponencial

      return {
        ...prev,
        reconnectAttempts: newAttempts,
        isConnecting: true
      };
    });
  }, [setupRealtimeSubscription, toast]);

  // Función pública para refrescar conversaciones
  const refreshConversations = useCallback(async () => {
    setLoading(true);
    await fetchConversations();
  }, [fetchConversations]);

  // Effect principal
  useEffect(() => {
    if (!userId) {
      cleanupSubscription();
      setConversations([]);
      setLoading(false);
      return;
    }

    // Cargar conversaciones iniciales
    fetchConversations();

    // Configurar suscripción realtime
    setupRealtimeSubscription();

    // Cleanup al desmontar
    return () => {
      cleanupSubscription();
    };
  }, [userId, fetchConversations, setupRealtimeSubscription, cleanupSubscription]);

  return {
    conversations,
    loading,
    connectionStatus,
    refreshConversations,
    error
  };
};
