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
  unread_count?: number;
  crm_clients?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    avatar_url?: string;
    tags?: string[];
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
  isFetchingMore: boolean;
  hasMore: boolean;
  connectionStatus: ConnectionStatus;
  refreshConversations: () => Promise<void>;
  loadMore: () => Promise<void>;
  error: string | null;
}

export const useRealtimeConversations = (userId: string | null): UseRealtimeConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingRef = useRef<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });
  const PAGE_SIZE = 20;

  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Función para obtener conversaciones iniciales o adicionales
  const fetchConversations = useCallback(async (isInitial = true) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (isInitial) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      if (isFetchingRef.current) return; // Prevent race conditions on concurrent scroll events
      setIsFetchingMore(true);
      isFetchingRef.current = true;
    }

    try {
      const currentPage = isInitial ? 0 : page + 1;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      console.log(`🔍 Fetching conversations for user: ${userId}, Range: ${from}-${to}`);

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
            avatar_url,
            tags
          )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
      }

      console.log(`💬 Conversations loaded (page ${currentPage}):`, data?.length || 0);
      
      if (data) {
        if (isInitial) {
          setConversations(data);
        } else {
          setConversations(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newConversations = data.filter(c => !existingIds.has(c.id));
            return [...prev, ...newConversations];
          });
        }
        
        setPage(currentPage);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      
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
      setIsFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, [userId, page, toast]);

  // Función para cargar más (Paginación)
  const loadMore = useCallback(async () => {
    if (loading || isFetchingRef.current || !hasMore) return;
    await fetchConversations(false);
  }, [loading, hasMore, fetchConversations]);

  // Helper to fetch a single conversation with full details
  const fetchSingleConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        crm_clients (
          id,
          name,
          email,
          phone,
          status,
          avatar_url,
          tags
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching single conversation:', error);
      return null;
    }
    return data;
  };

  // Función para manejar cambios en tiempo real
  const handleRealtimeChange = useCallback(async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    console.log('🔄 Realtime conversation change:', payload.eventType, (payload.new as Conversation)?.id);

    // For INSERT, we need to fetch the full conversation data (including crm_clients)
    // For UPDATE, we might receive partial data, so we should merge or refetch if critical data is missing

    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const recordId = (payload.new as unknown as Conversation).id;
      const record = payload.new as unknown as Conversation;

      // Basic check
      if (record.user_id !== userId) return;

      console.log(`✨ Realtime ${payload.eventType} detected, fetching full details for:`, recordId);

      const fullConversation = await fetchSingleConversation(recordId);

      if (fullConversation) {
        setConversations(prevConversations => {
          // For INSERT: Add to top if not exists
          if (payload.eventType === 'INSERT') {
            const exists = prevConversations.some(conv => conv.id === fullConversation.id);
            if (exists) return prevConversations;
            console.log('➕ Adding fully populated conversation:', fullConversation.id);
            return [fullConversation, ...prevConversations];
          }

          // For UPDATE: Update existing item
          console.log('🔄 Updating fully populated conversation:', fullConversation.id);
          return prevConversations.map(conv =>
            conv.id === fullConversation.id
              ? { ...conv, ...fullConversation }
              : conv
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        });
      }
      return;
    }

    setConversations(prevConversations => {
      switch (payload.eventType) {
        // INSERT and UPDATE handled above asynchronously
        // case 'INSERT': ...
        // case 'UPDATE': ...

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

  // Effect for initial loading
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Cargar conversaciones iniciales
    fetchConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Effect for realtime subscription lifecycle
  useEffect(() => {
    if (!userId) {
      cleanupSubscription();
      return;
    }

    // Configurar suscripción realtime
    setupRealtimeSubscription();

    // Cleanup al desmontar
    return () => {
      cleanupSubscription();
    };
  }, [userId, setupRealtimeSubscription, cleanupSubscription]);

  return {
    conversations,
    loading,
    isFetchingMore,
    hasMore,
    connectionStatus,
    refreshConversations,
    loadMore,
    error
  };
};
