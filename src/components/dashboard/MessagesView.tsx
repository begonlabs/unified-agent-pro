import React, { useState, useEffect } from 'react';
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
import EmojiPicker, { EmojiClickData, Categories } from 'emoji-picker-react';
import {
  Search,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Send,
  Smile,
  Plus,
  User,
  Bot,
  Filter,
  Wifi,
  WifiOff,
  Loader2,
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConversationConnectionStatus } from '@/components/ui/connection-status';
import { useDebounce } from '@/hooks/useDebounce';
import { NotificationService } from '@/components/notifications';
import { formatWhatsAppNumber, isPSID } from '@/utils/phoneNumberUtils';
import { useProfile } from '@/components/dashboard/profile/hooks/useProfile';
import { canSendMessage, getMessageUsagePercentage } from '@/lib/channelPermissions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  tags?: string[];
  last_interaction?: string;
  created_at: string;
  avatar_url?: string;
}

interface Conversation {
  id: string;
  channel: string;
  client?: Client;
  client_id?: string;
  last_message_at: string;
  status: string;
  channel_thread_id?: string;
  created_at: string;
  crm_clients?: Client;
  ai_enabled: boolean | null;
  unread_count?: number;
}

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_name?: string;
  is_automated: boolean;
  created_at: string;
}

const MessagesView = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Profile and Permissions
  const { profile } = useProfile(user);
  const messageCheck = profile ? canSendMessage(profile) : { allowed: true };
  const usagePercentage = profile ? getMessageUsagePercentage(profile) : 0;

  const [isSending, setIsSending] = useState(false);
  const [showEmojiPickerMobile, setShowEmojiPickerMobile] = useState(false);
  const [showEmojiPickerDesktop, setShowEmojiPickerDesktop] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list'); // Para controlar la vista en móvil
  const [previousMessageCount, setPreviousMessageCount] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Usar los nuevos hooks de realtime
  const {
    conversations,
    loading: conversationsLoading,
    connectionStatus,
    refreshConversations
  } = useRealtimeConversations(user?.id || null);

  // 🔄 Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 MessagesView: Refreshing conversations data');
      refreshConversations();
    },
    'messages'
  );

  // 🔔 Detectar mensajes nuevos y crear notificaciones
  React.useEffect(() => {
    if (!user?.id || !conversations.length) return;

    conversations.forEach(conversation => {
      const conversationId = conversation.id;
      const lastMessageTime = conversation.last_message_at;

      if (!lastMessageTime) return;

      const previousTime = previousMessageCount[conversationId] || 0;
      const currentTime = new Date(lastMessageTime).getTime();

      // Si hay un mensaje más reciente que el anterior
      if (currentTime > previousTime && previousTime > 0) {
        const clientName = conversation.crm_clients?.name || 'Cliente Anónimo';
        const channelName = conversation.channel === 'whatsapp' ? 'WhatsApp' :
          conversation.channel === 'facebook' ? 'Facebook' :
            conversation.channel === 'instagram' ? 'Instagram' :
              conversation.channel;

        // Crear notificación solo si no estamos viendo esta conversación actualmente
        if (selectedConversation !== conversationId) {
          console.log('🔔 Creando notificación para nuevo mensaje:', {
            client: clientName,
            channel: channelName,
            conversationId
          });

          NotificationService.createNotification(
            user.id,
            'message',
            `Nuevo mensaje de ${clientName}`,
            `Has recibido un nuevo mensaje en ${channelName}`,
            {
              priority: 'medium',
              metadata: {
                conversation_id: conversationId,
                channel: conversation.channel,
                client_name: clientName,
                last_message_time: lastMessageTime
              },
              action_url: `/dashboard/messages?conversation=${conversationId}`,
              action_label: 'Ver conversación'
            }
          ).catch(error => {
            console.error('Error creating message notification:', error);
          });
        }
      }

      // Actualizar el timestamp
      setPreviousMessageCount(prev => ({
        ...prev,
        [conversationId]: currentTime
      }));
    });
  }, [conversations, user?.id, selectedConversation, previousMessageCount]);

  const {
    messages,
    loading: messagesLoading,
    isConnected: messagesConnected,
    refreshMessages,
    sendOptimisticMessage,
    updateMessageStatus
  } = useRealtimeMessages(selectedConversation, user?.id || null);

  const scrollToBottom = () => {
    // Scroll all anchors (covers both mobile and desktop views)
    const anchors = document.querySelectorAll('.messages-end-anchor');
    anchors.forEach(anchor => {
      anchor.scrollIntoView({ behavior: "auto" });
    });
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, selectedConversation]);

  // Manejar selección de emoji
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPickerMobile(false);
    setShowEmojiPickerDesktop(false);
  };

  const sendMessage = async () => {
    // Check permissions first
    // Check permissions first - but only warn, don't block manual messages
    if (!messageCheck.allowed) {
      // Solo mostramos toast informativo, pero permitimos enviar
      console.log('⚠️ Límite de mensajes alcanzado, pero permitiendo envío manual');
    }

    if (!newMessage.trim() || !selectedConversation || !user?.id || isSending) {
      console.log('🚫 SendMessage: Condiciones no cumplidas', {
        hasMessage: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        hasUser: !!user?.id,
        isSending
      });
      return;
    }

    const messageContent = newMessage.trim();

    setIsSending(true);
    console.log('📤 Iniciando envío de mensaje:', {
      content: messageContent.substring(0, 50) + '...',
      conversationId: selectedConversation,
      userId: user.id
    });

    // Limpiar input inmediatamente para mejor UX
    setNewMessage('');
    let tempId: string | null = null;

    try {
      // Verificar que la conversación pertenezca al usuario
      const { data: conversationCheck } = await supabase
        .from('conversations')
        .select('user_id, channel')
        .eq('id', selectedConversation)
        .eq('user_id', user.id)
        .single();

      if (!conversationCheck) {
        throw new Error('No tienes permisos para enviar mensajes en esta conversación');
      }

      // Enviar mensaje optimista (aparece inmediatamente en la UI)
      tempId = sendOptimisticMessage({
        conversation_id: selectedConversation,
        content: messageContent,
        sender_type: 'agent',
        sender_name: 'Agente',
        is_automated: false
      });

      console.log('Mensaje optimista creado:', tempId);

      // Si es Facebook Messenger o Instagram, enviar a través de la API externa
      if (conversationCheck.channel === 'facebook' || conversationCheck.channel === 'instagram') {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              conversation_id: selectedConversation,
              message: messageContent,
              user_id: user.id,
              sender_type: 'agent',
              sender_name: 'Agente'
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en función send-message:', errorData);
            throw new Error(`Error enviando mensaje: ${errorData.error || 'Error desconocido'} ${errorData.details ? `(${errorData.details})` : ''}`);
          } else {
            const result = await response.json();
            console.log(`Mensaje enviado exitosamente a ${conversationCheck.channel}:`, result);
          }


        } catch (apiError) {
          console.error(`Error en ${conversationCheck.channel} API:`, apiError);
          throw apiError;
        }
      } else if (conversationCheck.channel === 'whatsapp') {
        // WhatsApp - enviar a través de send-message Edge Function
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_EDGE_BASE_URL}/functions/v1/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              conversation_id: selectedConversation,
              message: messageContent,
              user_id: user.id,
              sender_type: 'agent',
              sender_name: 'Agente'
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en función send-message:', errorData);
            throw new Error(`Error enviando mensaje: ${errorData.error || 'Error desconocido'}`);
          } else {
            const result = await response.json();
            console.log('Mensaje enviado exitosamente a WhatsApp:', result);
          }

        } catch (apiError) {
          console.error('Error en WhatsApp API:', apiError);
          throw apiError;
        }
      } else {
        // Para otros canales (genéricos), crear mensaje local
        const { data: savedMessage, error: dbError } = await supabase
          .from('messages')
          .insert({
            conversation_id: selectedConversation,
            content: messageContent,
            sender_type: 'agent',
            is_automated: false,
            sender_name: 'Agente'
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        console.log(`💾 Mensaje guardado en DB para canal ${conversationCheck.channel}:`, savedMessage.id);

        // Actualizar el mensaje optimista con el real
        if (savedMessage && tempId) {
          updateMessageStatus(tempId, savedMessage);
        }
      }


      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);

      console.log('Mensaje enviado exitosamente');

    } catch (error: unknown) {
      console.error('Error sending message:', error);

      // Restaurar el mensaje en el input si hubo error
      setNewMessage(messageContent);

      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Función para habilitar/deshabilitar IA en una conversación
  const toggleConversationAI = async (conversationId: string, aiEnabled: boolean) => {
    if (!user?.id) return;

    try {
      console.log('🤖 Toggle AI para conversación:', conversationId, 'Nuevo estado:', aiEnabled);

      const { error } = await supabase
        .from('conversations')
        .update({ ai_enabled: aiEnabled })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Obtener el nombre del cliente para el mensaje personalizado
      const conversation = conversations.find(c => c.id === conversationId);
      const clientName = conversation?.crm_clients?.name || 'este cliente';

      // Crear notificación para el cambio de estado de IA
      if (user?.id) {
        NotificationService.createNotification(
          user.id,
          'ai_response',
          aiEnabled ? 'IA Activada' : 'IA Desactivada',
          aiEnabled
            ? `La IA responderá automáticamente a los nuevos mensajes de ${clientName}`
            : `Solo tú responderás a los mensajes de ${clientName}`,
          {
            priority: 'low',
            metadata: {
              conversation_id: conversationId,
              client_name: clientName,
              ai_enabled: aiEnabled
            },
            action_url: `/dashboard/messages?conversation=${conversationId}`,
            action_label: 'Ver conversación'
          }
        ).catch(error => {
          console.error('Error creating AI toggle notification:', error);
        });
      }

      // Refrescar conversaciones para mostrar el nuevo estado
      refreshConversations();

    } catch (error: unknown) {
      console.error('Error toggling AI:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la IA",
        variant: "destructive",
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.crm_clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.channel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'unread' && (conv.unread_count || 0) > 0) ||
      (filterStatus === 'read' && (conv.unread_count || 0) === 0);
    const matchesChannel = filterChannel === 'all' || conv.channel === filterChannel;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Funciones para navegación móvil tipo WhatsApp
  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setMobileView('chat'); // Cambiar a vista de chat en móvil

    // Resetear contador de mensajes no leídos
    if (user?.id) {
      try {
        await supabase
          .from('conversations')
          .update({ unread_count: 0 } as any)
          .eq('id', conversationId)
          .eq('user_id', user.id);

        console.log('✅ Unread count reset for conversation:', conversationId);
      } catch (error) {
        console.error('Error resetting unread count:', error);
      }
    }
  };

  const handleBackToList = () => {
    setMobileView('list'); // Volver a la lista en móvil
    setSelectedConversation(null); // Limpiar conversación seleccionada
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent selecting the conversation

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Conversación eliminada",
        description: "La conversación ha sido eliminada correctamente.",
      });

      // Refresh conversations list
      refreshConversations();

      // If the deleted conversation was selected, deselect it
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMobileView('list');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la conversación.",
      });
    }
  };

  // Manejar navegación desde notificaciones
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationParam = urlParams.get('conversation');

    if (conversationParam && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationParam);
      if (conversation) {
        setSelectedConversation(conversationParam);
        setMobileView('chat');

        // Limpiar URL después de navegar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [conversations]);

  const conversationStats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'open').length,
    withAI: conversations.filter(c => c.ai_enabled).length,
    channels: [...new Set(conversations.map(c => c.channel))].length
  };

  // Render message limit warning
  const renderMessageLimitWarning = () => {
    if (!profile) return null;

    // Show warning if usage is high (> 80%) or if limit reached
    if (usagePercentage >= 80 || !messageCheck.allowed) {
      return (
        <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-yellow-800 flex items-center gap-1">
              {messageCheck.allowed ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Uso de mensajes: {profile.messages_sent_this_month} / {profile.messages_limit}
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">Límite alcanzado: IA Pausada</span>
                </>
              )}
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600"
              onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
            >
              Mejorar Plan
            </Button>
          </div>
          <Progress
            value={Math.min(usagePercentage, 100)}
            className={`h-1.5 ${!messageCheck.allowed ? 'bg-red-100' : 'bg-yellow-100'}`}
            indicatorClassName={!messageCheck.allowed ? 'bg-red-500' : usagePercentage >= 90 ? 'bg-red-500' : 'bg-yellow-500'}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: Lista de conversaciones */}
        <div className={`w-full sm:w-80 bg-white border-r flex flex-col ${mobileView === 'list' ? 'block' : 'hidden sm:flex'}`}>
          {/* Header fijo de conversaciones */}
          <div className="flex-shrink-0 bg-white border-b p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="sm:hidden">Chats</span>
                  <span className="hidden sm:inline">Conversaciones</span>
                </h2>
                <ConversationConnectionStatus
                  status={connectionStatus}
                  onReconnect={refreshConversations}
                />
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 bg-gray-50 text-sm sm:text-base"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:flex-1 text-sm sm:text-base">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">Nuevo</SelectItem>
                  <SelectItem value="read">Leído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-full sm:flex-1 text-sm sm:text-base">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de conversaciones con scroll independiente */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay conversaciones</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg border-b border-gray-100 ${selectedConversation === conversation.id
                      ? 'bg-blue-50'
                      : 'bg-white'
                      }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                          {conversation.crm_clients?.avatar_url ? (
                            <img
                              src={conversation.crm_clients.avatar_url}
                              alt={conversation.crm_clients.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm sm:text-base font-semibold">
                              {conversation.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          {/* Nombre del cliente - línea completa */}
                          <div className="mb-1">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                              {conversation.crm_clients?.name || 'Cliente Anónimo'}
                            </h3>
                          </div>

                          {/* Información de contacto */}
                          <div className="mb-2">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {(() => {
                                const phone = conversation.crm_clients?.phone;
                                const email = conversation.crm_clients?.email;

                                // If there's a phone and it's NOT a PSID, format and display it
                                if (phone && !isPSID(phone)) {
                                  const formatted = formatWhatsAppNumber(phone);
                                  if (formatted) {
                                    return (
                                      <span className="flex items-center gap-2">
                                        <span>{formatted.flag}</span>
                                        <span>{formatted.formattedNumber}</span>
                                      </span>
                                    );
                                  }
                                }

                                // If there's an email, show it
                                if (email) {
                                  return email;
                                }

                                // Otherwise, show the channel name
                                const channelName = conversation.channel === 'facebook' ? 'Facebook' :
                                  conversation.channel === 'instagram' ? 'Instagram' :
                                    conversation.channel === 'whatsapp' ? 'WhatsApp' :
                                      'Sin contacto';

                                return channelName;
                              })()}
                            </p>
                          </div>

                          {/* Badges y estado en una línea */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge
                                variant={(conversation.unread_count || 0) > 0 ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {(conversation.unread_count || 0) > 0 ? 'Nuevo' : 'Leído'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getChannelIcon(conversation.channel)}
                              {conversation.ai_enabled && (
                                <Bot className="h-3 w-3 text-purple-600" />
                              )}
                            </div>
                          </div>

                          {/* Fecha */}
                          <p className="text-xs text-gray-500">
                            {new Date(conversation.last_message_at).toLocaleDateString()} {new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Delete Button - Visible on hover or always visible on mobile */}
                        <div className="flex items-center self-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteConversation(e, conversation.id)}
                            title="Eliminar conversación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mobile Chat Area - Tipo WhatsApp */}
        {mobileView === 'chat' && selectedConversation && (
          <div className="sm:hidden flex-1 flex flex-col bg-white">
            {/* Header fijo tipo WhatsApp */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="text-white hover:bg-white/20 p-2 -ml-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Avatar className="h-10 w-10">
                  {selectedConv?.crm_clients?.avatar_url ? (
                    <img
                      src={selectedConv.crm_clients.avatar_url}
                      alt={selectedConv.crm_clients.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                      {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">
                    {selectedConv?.crm_clients?.name || 'Cliente Anónimo'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      {getChannelIcon(selectedConv?.channel || '')}
                      <span className="capitalize">{selectedConv?.channel}</span>
                    </div>
                    {(() => {
                      const phone = selectedConv?.crm_clients?.phone;

                      // Only show phone if it's NOT a PSID
                      if (phone && !isPSID(phone)) {
                        const formatted = formatWhatsAppNumber(phone);
                        if (formatted) {
                          return (
                            <span className="flex items-center gap-1">
                              <span>{formatted.flag}</span>
                              <span>{formatted.formattedNumber}</span>
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                    {messagesConnected ? (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <Wifi className="h-3 w-3 text-green-400" />
                        <span className="text-xs">Online</span>
                      </div>
                    ) : messagesLoading ? (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                        <span className="text-xs">Cargando</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <WifiOff className="h-3 w-3 text-red-400" />
                        <span className="text-xs">Sin conexión</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                <Bot className="h-3 w-3 text-white" />
                <span className="text-xs text-white">IA</span>
                <Switch
                  checked={selectedConv?.ai_enabled || false}
                  onCheckedChange={(checked) => toggleConversationAI(selectedConv?.id || '', checked)}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20"
                />
              </div>
            </div>

            {/* Área de mensajes con scroll independiente */}
            {/* Área de mensajes con scroll independiente */}
            <div className="flex-1 overflow-y-auto p-3" style={{ backgroundImage: 'url(/chat-background.jpg)', backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
              <div className="space-y-3 max-w-full">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex animate-fade-in ${message.sender_type === 'client' ? 'justify-start' : 'justify-end'
                        }`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {message.sender_type === 'client' && (
                          <Avatar className="h-6 w-6 mb-1">
                            <AvatarFallback className="bg-gray-500 text-white text-xs">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm ${message.sender_type === 'client'
                            ? 'bg-white text-gray-900 rounded-tl-md'
                            : message.is_automated
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-tr-md'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md'
                            }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <p className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {message.is_automated && (
                              <div className="flex items-center gap-1">
                                <Bot className="h-3 w-3" />
                                <span className="text-xs">IA</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {message.sender_type !== 'client' && (
                          <Avatar className="h-6 w-6 mb-1">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {message.is_automated ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div className="messages-end-anchor" />
              </div>
            </div>

            {/* Input de mensaje estilo claro con bordes redondeados */}
            <div className="bg-white border-t border-gray-200">
              {renderMessageLimitWarning()}
              <div className="p-2 flex gap-2 items-center">
                {/* Botón de emoji */}
                <Popover open={showEmojiPickerMobile} onOpenChange={setShowEmojiPickerMobile}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!messageCheck.allowed}
                      className="h-[40px] w-[40px] rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 flex-shrink-0"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-full p-0 border-none">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={320}
                      height={400}
                      searchPlaceholder="Buscar emoji..."
                      previewConfig={{
                        showPreview: false
                      }}
                      categories={[
                        {
                          category: Categories.SUGGESTED,
                          name: "Usados Frecuentemente"
                        },
                        {
                          category: Categories.SMILEYS_PEOPLE,
                          name: "Caritas y Personas"
                        },
                        {
                          category: Categories.ANIMALS_NATURE,
                          name: "Animales y Naturaleza"
                        },
                        {
                          category: Categories.FOOD_DRINK,
                          name: "Comida y Bebida"
                        },
                        {
                          category: Categories.TRAVEL_PLACES,
                          name: "Viajes y Lugares"
                        },
                        {
                          category: Categories.ACTIVITIES,
                          name: "Actividades"
                        },
                        {
                          category: Categories.OBJECTS,
                          name: "Objetos"
                        },
                        {
                          category: Categories.SYMBOLS,
                          name: "Símbolos"
                        },
                        {
                          name: "Banderas"
                        }
                      ]}
                    />
                  </PopoverContent>
                </Popover>

                {/* Input de texto */}
                <div className="flex-1">
                  <Textarea
                    placeholder={"Escribe un mensaje..."}
                    value={newMessage}
                    disabled={false}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="min-h-[40px] max-h-32 resize-none text-sm rounded-full border-gray-300 focus:border-blue-500 bg-white py-2"
                    rows={1}
                  />
                </div>

                {/* Botón de enviar */}
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className={`h-[40px] w-[40px] rounded-full transition-all duration-200 ${isSending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    }`}
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Chat Area */}
        <div className="hidden sm:flex flex-1 flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header fijo */}
              <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      {selectedConv?.crm_clients?.avatar_url ? (
                        <img
                          src={selectedConv.crm_clients.avatar_url}
                          alt={selectedConv.crm_clients.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-white/20 text-white text-sm sm:text-base">
                          {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">
                        {selectedConv?.crm_clients?.name || 'Cliente Anónimo'}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-white/80">
                        <div className="flex items-center gap-1">
                          {getChannelIcon(selectedConv?.channel || '')}
                          <span className="capitalize">{selectedConv?.channel}</span>
                        </div>
                        {selectedConv?.crm_clients?.email && (
                          <span className="truncate">{selectedConv.crm_clients.email}</span>
                        )}
                        {(() => {
                          const phone = selectedConv?.crm_clients?.phone;

                          // Only show phone if it's NOT a PSID
                          if (phone && !isPSID(phone)) {
                            const formatted = formatWhatsAppNumber(phone);
                            if (formatted) {
                              return (
                                <span className="flex items-center gap-1">
                                  <span>{formatted.flag}</span>
                                  <span>{formatted.formattedNumber}</span>
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                        {/* Estado de conexión de mensajes */}
                        <div className="flex items-center gap-1">
                          {messagesConnected ? (
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                              <Wifi className="h-3 w-3 text-green-400" />
                              <span className="text-xs">Online</span>
                            </div>
                          ) : messagesLoading ? (
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                              <span className="text-xs">Cargando</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                              <WifiOff className="h-3 w-3 text-red-400" />
                              <span className="text-xs">Sin conexión</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      <span className="text-xs text-white">IA</span>
                      <Switch
                        checked={selectedConv?.ai_enabled || false}
                        onCheckedChange={(checked) => toggleConversationAI(selectedConv?.id || '', checked)}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages con scroll independiente */}
              {/* Messages con scroll independiente */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ backgroundImage: 'url(/chat-background.jpg)', backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
                <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No hay mensajes en esta conversación</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex animate-fade-in ${message.sender_type === 'client' ? 'justify-start' : 'justify-end'
                          }`}
                      >
                        <div className="flex items-start gap-2 max-w-xs sm:max-w-sm lg:max-w-md">
                          {message.sender_type === 'client' && (
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1">
                              <AvatarFallback className="bg-gray-500 text-white text-xs">
                                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${message.sender_type === 'client'
                              ? 'bg-white text-gray-900 rounded-tl-md'
                              : message.is_automated
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-tr-md'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md'
                              }`}
                          >
                            <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                            <div className="flex items-center justify-between gap-2 mt-1 sm:mt-2">
                              <p className="text-xs opacity-70">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {message.is_automated && (
                                <div className="flex items-center gap-1">
                                  <Bot className="h-3 w-3" />
                                  <span className="text-xs">IA</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {message.sender_type !== 'client' && (
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1">
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {message.is_automated ? <Bot className="h-3 w-3 sm:h-4 sm:w-4" /> : <User className="h-3 w-3 sm:h-4 sm:w-4" />}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="messages-end-anchor" />
                </div>
              </div>

              {/* Input de mensaje estilo claro con bordes redondeados */}
              <div className="bg-white border-t border-gray-200">
                {renderMessageLimitWarning()}
                <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 items-center">
                  {/* Botón de emoji */}
                  <Popover open={showEmojiPickerDesktop} onOpenChange={setShowEmojiPickerDesktop}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={false}
                        className="h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 flex-shrink-0"
                      >
                        <Smile className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-full p-0 border-none">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={350}
                        height={450}
                        searchPlaceholder="Buscar emoji..."
                        previewConfig={{
                          showPreview: false
                        }}
                        categories={[
                          {
                            category: Categories.SUGGESTED,
                            name: "Usados Frecuentemente"
                          },
                          {
                            category: Categories.SMILEYS_PEOPLE,
                            name: "Caritas y Personas"
                          },
                          {
                            category: Categories.ANIMALS_NATURE,
                            name: "Animales y Naturaleza"
                          },
                          {
                            category: Categories.FOOD_DRINK,
                            name: "Comida y Bebida"
                          },
                          {
                            category: Categories.TRAVEL_PLACES,
                            name: "Viajes y Lugares"
                          },
                          {
                            category: Categories.ACTIVITIES,
                            name: "Actividades"
                          },
                          {
                            category: Categories.OBJECTS,
                            name: "Objetos"
                          },
                          {
                            category: Categories.SYMBOLS,
                            name: "Símbolos"
                          },
                          {
                            category: Categories.FLAGS,
                            name: "Banderas"
                          }
                        ]}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Input de texto */}
                  <div className="flex-1">
                    <Textarea
                      placeholder={"Escribe un mensaje..."}
                      value={newMessage}
                      disabled={false}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="min-h-[44px] sm:min-h-[48px] max-h-32 resize-none text-sm sm:text-base rounded-full border-gray-300 focus:border-blue-500 bg-white py-2"
                      rows={1}
                    />
                  </div>

                  {/* Botón de enviar */}
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                    className={`h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] rounded-full transition-all duration-200 ${isSending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      }`}
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ backgroundImage: 'url(/chat-background.jpg)', backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
              <div className="text-center">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                  <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    Elige una conversación de la lista para ver los mensajes y comenzar a chatear con tus clientes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;