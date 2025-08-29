import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseInsert, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Send, 
  User,
  Bot,
  Clock,
  CheckCircle2,
  Users,
  Filter,
  MoreHorizontal,
  Star,
  Archive,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('conversations');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'lead',
    tags: [] as string[]
  });
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

  const {
    messages,
    loading: messagesLoading,
    isConnected: messagesConnected,
    refreshMessages,
    sendOptimisticMessage,
    updateMessageStatus
  } = useRealtimeMessages(selectedConversation, user?.id || null);

  // Función para obtener clientes (conservamos solo esta)
  const fetchClients = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Fetching clients for user:', user.id);
      
      const { data } = await supabaseSelect(
        supabase
          .from('crm_clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      );
      
      console.log('👥 Clients fetched:', data?.length || 0);
      setClients(data || []);
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudieron cargar los clientes");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

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
        sender_type: 'human',
        sender_name: 'Tú',
        is_automated: false
      });

      console.log('✅ Mensaje optimista creado:', tempId);
      
      // Guardar mensaje en la base de datos local PRIMERO
      const { data: savedMessage, error: dbError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          content: messageContent,
          sender_type: 'human',
          is_automated: false,
          sender_name: 'Tú'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      console.log('💾 Mensaje guardado en DB:', savedMessage.id);

      // Actualizar el mensaje optimista con el real
      if (savedMessage && tempId) {
        updateMessageStatus(tempId, savedMessage);
      }
      
      // Si es Facebook Messenger, enviar a través de la API externa
      if (conversationCheck.channel === 'facebook') {
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
              user_id: user.id
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('⚠️ Error en Facebook API:', errorData);
            // No lanzar error, el mensaje ya se guardó localmente
          } else {
            const result = await response.json();
            console.log('✅ Message sent to Facebook:', result);
          }

        } catch (facebookError) {
          console.warn('⚠️ Facebook API error:', facebookError);
          // No lanzar error, el mensaje ya se guardó localmente
        }
      }
      
      // Update conversation last_message_at
      await supabaseUpdate(
        supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', selectedConversation)
      );
      
      console.log('✅ Mensaje enviado exitosamente');
      
    } catch (error: unknown) {
      console.error('❌ Error sending message:', error);
      
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
      console.error('❌ Error toggling AI:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la IA",
        variant: "destructive",
      });
    }
  };

  const createClient = async () => {
    try {
      // Verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({
          title: "Error de autenticación",
          description: "Debes estar autenticado para crear clientes",
          variant: "destructive",
        });
        return;
      }

      console.log('👤 Creating client for user:', user.id);
      
      const { data, error } = await supabase
        .from('crm_clients')
        .insert([{
          ...newClient,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      setNewClient({ name: '', email: '', phone: '', status: 'lead', tags: [] });
      setIsNewClientDialogOpen(false);
      
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido añadido exitosamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };

  const updateClientStatus = async (clientId: string, status: string) => {
    try {
      // Verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({
          title: "Error de autenticación",
          description: "Debes estar autenticado para actualizar clientes",
          variant: "destructive",
        });
        return;
      }

      // Verificar que el cliente pertenezca al usuario
      const { data: clientCheck } = await supabase
        .from('crm_clients')
        .select('user_id')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (!clientCheck) {
        toast({
          title: "Error de permisos",
          description: "No tienes permisos para actualizar este cliente",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Updating client status for user:', user.id, 'client:', clientId);
      
      const { error } = await supabase
        .from('crm_clients')
        .update({ status })
        .eq('id', clientId)
        .eq('user_id', user.id);  // ✅ Doble verificación de seguridad

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      ));
      
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
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

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // useEffect para inicializar clientes
  useEffect(() => {
    if (user?.id) {
      fetchClients();
    }
  }, [user?.id, fetchClients]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="px-6 pt-6">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mensajes y CRM</h1>
              <p className="text-white/80 text-sm">Gestiona tus conversaciones y clientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col rounded-tr-2xl">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Mensajes/CRM</h2>
              <ConversationConnectionStatus 
                status={connectionStatus}
                onReconnect={refreshConversations}
              />
            </div>
            <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={newClient.status} onValueChange={(value) => setNewClient(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospecto</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createClient} className="w-full" disabled={!newClient.name}>
                    Crear Cliente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospecto</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="flex-1">
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                CRM
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} className="flex-1 flex flex-col">
          <TabsContent value="conversations" className="flex-1 m-0">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay conversaciones</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <Card 
                      key={conversation.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md rounded-xl border ${
                        selectedConversation === conversation.id 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {conversation.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate text-sm">
                                {conversation.crm_clients?.name || 'Cliente Anónimo'}
                              </h3>
                              <div className="flex items-center gap-1">
                                {getChannelIcon(conversation.channel)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
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
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.crm_clients?.email || conversation.crm_clients?.phone || 'Sin contacto'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conversation.last_message_at).toLocaleDateString()} {new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="clients" className="flex-1 m-0">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay clientes</p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-all duration-200 rounded-xl border">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                              {client.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate text-sm">{client.name}</h3>
                              <Select 
                                value={client.status} 
                                onValueChange={(value) => updateClientStatus(client.id, value)}
                              >
                                <SelectTrigger className="w-20 h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="prospect">Prospecto</SelectItem>
                                  <SelectItem value="client">Cliente</SelectItem>
                                  <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Badge 
                              className={`text-xs mb-2 ${getStatusColor(client.status)}`}
                              variant="secondary"
                            >
                              {client.status}
                            </Badge>
                            {client.email && (
                              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                            )}
                            {client.phone && (
                              <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Creado: {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-tl-2xl overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white/20 text-white">
                      {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedConv?.crm_clients?.name || 'Cliente Anónimo'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <div className="flex items-center gap-1">
                        {getChannelIcon(selectedConv?.channel || '')}
                        <span className="capitalize">{selectedConv?.channel}</span>
                      </div>
                      {selectedConv?.crm_clients?.email && (
                        <span>{selectedConv.crm_clients.email}</span>
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Bot className="h-4 w-4 text-white" />
                    <span className="text-xs text-white">IA</span>
                    <Switch
                      checked={selectedConv?.ai_enabled || false}
                      onCheckedChange={(checked) => toggleConversationAI(selectedConv?.id || '', checked)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20"
                    />
                  </div>
                  <Badge 
                    className={`bg-white/20 text-white border-white/20 ${getStatusColor(selectedConv?.crm_clients?.status || 'lead')}`}
                    variant="secondary"
                  >
                    {selectedConv?.crm_clients?.status || 'lead'}
                  </Badge>
                  <Badge 
                    className="bg-white/20 text-white border-white/20"
                    variant={selectedConv?.status === 'open' ? 'default' : 'secondary'}
                  >
                    {selectedConv?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex animate-fade-in ${
                        message.sender_type === 'client' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div className="flex items-start gap-2 max-w-xs lg:max-w-md">
                        {message.sender_type === 'client' && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-gray-500 text-white text-xs">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender_type === 'client'
                              ? 'bg-white text-gray-900 rounded-tl-md'
                              : message.is_automated
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-tr-md'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-between gap-2 mt-2">
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
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {message.is_automated ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
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
            <div className="p-4 bg-white border-t">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
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
                      className="min-h-[60px] max-h-32 resize-none"
                      rows={2}
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || isSending}
                    size="lg"
                    className={`h-[60px] px-6 transition-all duration-200 ${
                      isSending 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span className="text-xs">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
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
              <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500 leading-relaxed">
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