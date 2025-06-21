
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Phone, MessageCircle, Instagram, Facebook, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  tags?: string[];
  last_interaction?: string;
}

interface Conversation {
  id: string;
  channel: string;
  client?: Client;
  last_message_at: string;
  status: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchConversations();
  }, []);

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

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <Phone className="h-4 w-4 text-green-400" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-400" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-400" />;
      default:
        return <MessageCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex bg-zinc-900">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-zinc-700 bg-zinc-800/50 backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono font-bold tracking-wider uppercase text-white">Conversaciones</h2>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-mono text-xs uppercase tracking-wider">
              <Plus className="h-4 w-4 mr-2" />
              Nueva
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-2 space-y-2">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className={`cursor-pointer transition-all duration-300 border ${
                  selectedConversation === conversation.id 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50' 
                    : 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-700/50 hover:border-zinc-600'
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-zinc-700 text-white font-mono">
                        {conversation.client?.name?.substring(0, 2).toUpperCase() || 'CL'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono font-medium truncate text-white">
                          {conversation.client?.name || 'Cliente Anónimo'}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getChannelIcon(conversation.channel)}
                          <Badge variant={conversation.status === 'open' ? 'default' : 'secondary'} className="text-xs font-mono">
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 truncate font-mono">
                        {conversation.client?.email || conversation.client?.phone}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        {new Date(conversation.last_message_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-700 bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-zinc-700 text-white font-mono">
                    {selectedConv?.client?.name?.substring(0, 2).toUpperCase() || 'CL'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-mono font-semibold text-white">
                    {selectedConv?.client?.name || 'Cliente Anónimo'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(selectedConv?.channel || '')}
                    <span className="text-sm text-zinc-400 capitalize font-mono">
                      {selectedConv?.channel}
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge variant={selectedConv?.status === 'open' ? 'default' : 'secondary'} className="font-mono">
                    {selectedConv?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-zinc-900">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'client' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg font-mono ${
                        message.sender_type === 'client'
                          ? 'bg-zinc-700 text-zinc-100'
                          : message.is_automated
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        {message.is_automated && (
                          <Badge variant="secondary" className="text-xs font-mono">IA</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-zinc-700 bg-zinc-800/30">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-zinc-900">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-medium text-white mb-2 uppercase tracking-wider">
                Selecciona una conversación
              </h3>
              <p className="text-zinc-400 font-mono">
                Elige una conversación para ver los mensajes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
