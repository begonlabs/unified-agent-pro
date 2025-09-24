import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { ConversationConnectionStatus } from '@/components/ui/connection-status';
import { useDebounce, useMessageSender } from '@/hooks/useDebounce';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  tags?: string[];
  last_interaction?: string;
  created_at: string;
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
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list'); // Para controlar la vista en móvil
  const { toast } = useToast();
  
  // Hook para prevenir mensajes duplicados
  const { isDuplicateMessage } = useMessageSender();

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

  const {
    messages,
    loading: messagesLoading,
    isConnected: messagesConnected,
    refreshMessages,
    sendOptimisticMessage,
    updateMessageStatus
  } = useRealtimeMessages(selectedConversation, user?.id || null);

  // Función principal de envío (sin debouncing directo)
  const sendMessageCore = async () => {
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
    
    // Verificar duplicados
    if (isDuplicateMessage(messageContent, selectedConversation)) {
      console.log('🚫 Mensaje duplicado detectado, cancelando envío');
      return;
    }

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
            throw new Error(`Error enviando mensaje: ${errorData.error || 'Error desconocido'}`);
          } else {
            const result = await response.json();
            console.log(`Mensaje enviado exitosamente a ${conversationCheck.channel}:`, result);
          }

        } catch (apiError) {
          console.error(`Error en ${conversationCheck.channel} API:`, apiError);
          throw apiError;
        }
      } else {
        // Para otros canales que no sean Facebook o Instagram (ej: WhatsApp), crear mensaje local
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

  // Función con debouncing para uso en el UI
  const sendMessage = useDebounce(sendMessageCore, 500);

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

      toast({
        title: aiEnabled ? "🤖 IA Activada" : "👤 IA Desactivada",
        description: aiEnabled 
          ? "La IA responderá automáticamente a los nuevos mensajes" 
          : "Solo tú responderás a los mensajes",
      });

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
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || conv.channel === filterChannel;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Funciones para navegación móvil tipo WhatsApp
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setMobileView('chat'); // Cambiar a vista de chat en móvil
  };

  const handleBackToList = () => {
    setMobileView('list'); // Volver a la lista en móvil
    setSelectedConversation(null); // Limpiar conversación seleccionada
  };

  const conversationStats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'open').length,
    withAI: conversations.filter(c => c.ai_enabled).length,
    channels: [...new Set(conversations.map(c => c.channel))].length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                Centro de Mensajes
              </h1>
              <p className="text-white/80 text-xs sm:text-sm">Gestiona todas tus conversaciones en un solo lugar</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{conversationStats.total}</div>
                <div className="text-xs text-white/80">Total</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-200">{conversationStats.active}</div>
                <div className="text-xs text-white/80">Activas</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-200">{conversationStats.withAI}</div>
                <div className="text-xs text-white/80">Con IA</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-200">{conversationStats.channels}</div>
                <div className="text-xs text-white/80">Canales</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-3 sm:mt-4">
        {/* Mobile: Lista de conversaciones */}
        <div className={`w-full sm:w-80 bg-white border-r flex flex-col rounded-tr-2xl ${mobileView === 'list' ? 'block' : 'hidden sm:flex'}`}>
          <div className="p-3 sm:p-4 border-b">
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
                  <SelectItem value="open">Abiertos</SelectItem>
                  <SelectItem value="closed">Cerrados</SelectItem>
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

          <ScrollArea className="flex-1">
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
                    className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg border-b border-gray-100 ${
                      selectedConversation === conversation.id 
                        ? 'bg-blue-50' 
                        : 'bg-white'
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm sm:text-base font-semibold">
                            {conversation.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate text-sm sm:text-base">
                              {conversation.crm_clients?.name || 'Cliente Anónimo'}
                            </h3>
                            <div className="flex items-center gap-1">
                              {getChannelIcon(conversation.channel)}
                              {conversation.ai_enabled && (
                                <Bot className="h-3 w-3 text-purple-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.crm_clients?.email || conversation.crm_clients?.phone || 'Sin contacto'}
                            </p>
                            <div className="flex items-center gap-1">
                            <Badge 
                              className={`text-xs ${getStatusColor(conversation.crm_clients?.status || 'lead')}`}
                              variant="secondary"
                            >
                              {conversation.crm_clients?.status || 'lead'}
                            </Badge>
                            <Badge 
                              variant={conversation.status === 'open' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {conversation.status}
                            </Badge>
                          </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(conversation.last_message_at).toLocaleDateString()} {new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile Chat Area - Tipo WhatsApp */}
        {mobileView === 'chat' && selectedConversation && (
          <div className="sm:hidden flex-1 flex flex-col overflow-hidden bg-white">
            {/* Header tipo WhatsApp */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
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
                  <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                    {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                  </AvatarFallback>
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
                    {messagesConnected ? (
                      <span className="bg-white/20 px-2 py-1 rounded-full">🟢 En vivo</span>
                    ) : messagesLoading ? (
                      <span className="bg-white/20 px-2 py-1 rounded-full">🔄 Cargando...</span>
                    ) : (
                      <span className="bg-white/20 px-2 py-1 rounded-full">🔴 Sin conexión</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Área de mensajes tipo WhatsApp */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-3">
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
                      className={`flex animate-fade-in ${
                        message.sender_type === 'client' ? 'justify-start' : 'justify-end'
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
                          className={`px-4 py-2 rounded-2xl shadow-sm ${
                            message.sender_type === 'client'
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
              </div>
            </div>

            {/* Input tipo WhatsApp */}
            <div className="p-3 bg-white border-t">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Textarea
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="min-h-[44px] max-h-32 resize-none text-sm rounded-full border-gray-300 focus:border-blue-500"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || isSending}
                  size="lg"
                  className={`h-[44px] w-[44px] rounded-full transition-all duration-200 ${
                    isSending 
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
        <div className="hidden sm:flex flex-1 flex-col rounded-tl-2xl overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-white/20 text-white text-sm sm:text-base">
                        {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                      </AvatarFallback>
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
                        {selectedConv?.crm_clients?.phone && (
                          <span>{selectedConv.crm_clients.phone}</span>
                        )}
                        {/* Estado de conexión de mensajes */}
                        <div className="flex items-center gap-1">
                          {messagesConnected ? (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🟢 En vivo</span>
                          ) : messagesLoading ? (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🔄 Cargando...</span>
                          ) : (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">🔴 Sin conexión</span>
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
                    <div className="flex gap-2">
                    <Badge 
                        className={`bg-white/20 text-white border-white/20 text-xs ${getStatusColor(selectedConv?.crm_clients?.status || 'lead')}`}
                      variant="secondary"
                    >
                      {selectedConv?.crm_clients?.status || 'lead'}
                    </Badge>
                    <Badge 
                        className="bg-white/20 text-white border-white/20 text-xs"
                      variant={selectedConv?.status === 'open' ? 'default' : 'secondary'}
                    >
                      {selectedConv?.status}
                    </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-4 bg-gray-50">
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
                        className={`flex animate-fade-in ${
                          message.sender_type === 'client' ? 'justify-start' : 'justify-end'
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
                            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                              message.sender_type === 'client'
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
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 sm:p-4 bg-white border-t">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Escribe tu mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="min-h-[50px] sm:min-h-[60px] max-h-32 resize-none text-sm sm:text-base"
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending}
                      size="lg"
                      className={`h-[50px] sm:h-[60px] px-3 sm:px-6 transition-all duration-200 ${
                        isSending 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      }`}
                    >
                      {isSending ? (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                          <span className="text-xs">Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-xs hidden sm:inline">Enviar</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
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