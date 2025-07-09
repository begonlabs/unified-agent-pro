import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [clients, setClients] = useState<Client[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('conversations');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'lead',
    tags: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchConversations();
    
    // Set up real-time subscription for conversations
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (selectedConversation && payload.new && 
            (payload.new as any).conversation_id === selectedConversation) {
          fetchMessages(selectedConversation);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          crm_clients (*)
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          content: newMessage,
          sender_type: 'human',
          is_automated: false,
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
      
      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);
        
      fetchConversations();
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const createClient = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_clients')
        .insert([{
          ...newClient,
          user_id: (await supabase.auth.getUser()).data.user?.id
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };

  const updateClientStatus = async (clientId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('crm_clients')
        .update({ status })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      ));
      
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado",
      });
    } catch (error: any) {
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

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Mensajes/CRM</h2>
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
              className="pl-10"
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
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedConversation === conversation.id 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
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
                    <Card key={client.id} className="hover:shadow-md transition-all duration-200">
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {selectedConv?.crm_clients?.name?.substring(0, 2).toUpperCase() || 'CL'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedConv?.crm_clients?.name || 'Cliente Anónimo'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={getStatusColor(selectedConv?.crm_clients?.status || 'lead')}
                    variant="secondary"
                  >
                    {selectedConv?.crm_clients?.status || 'lead'}
                  </Badge>
                  <Badge variant={selectedConv?.status === 'open' ? 'default' : 'secondary'}>
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
                    disabled={!newMessage.trim()}
                    size="lg"
                    className="h-[60px] px-6"
                  >
                    <Send className="h-5 w-5" />
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
  );
};

export default MessagesView;