
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseInsert, supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, HelpCircle, AlertCircle, ArrowLeft, Clock, User, Bot, CheckCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  unread_count: number;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  message_type: 'user' | 'admin' | 'system';
  is_read: boolean;
  created_at: string;
}

const SupportView = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  // Función para cargar tickets del usuario
  const fetchTickets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      setLoadingTickets(true);
      
      // Usar la función RPC para obtener tickets con contadores
      const { data: ticketsData, error } = await supabase
        .rpc('get_user_tickets_with_message_count', { _user_id: user.id });

      if (error) {
        console.error('Error loading tickets:', error);
        return;
      }
      
      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  // Función para cargar mensajes de un ticket específico
  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      setLoadingMessages(true);
      
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          id,
          ticket_id,
          user_id,
          message,
          message_type,
          is_read,
          created_at
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      // Mapear los datos para que coincidan con la interfaz
      const mappedMessages = (data || []).map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id || '',
        user_id: msg.user_id,
        message: msg.message,
        message_type: (msg.message_type || 'user') as 'user' | 'admin' | 'system',
        is_read: msg.is_read || false,
        created_at: msg.created_at
      }));
      
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Cargar tickets cuando se monta el componente
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Cargar mensajes cuando se selecciona un ticket
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket, fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Crear ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          priority: formData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Crear mensaje inicial
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          user_id: user.id,
          message: formData.message,
          message_type: 'user',
          subject: formData.subject,
          priority: formData.priority,
          status: 'open'
        });

      if (messageError) throw messageError;

      toast({
        title: "Ticket creado",
        description: "Tu consulta ha sido enviada exitosamente. Te responderemos pronto.",
      });

      // Limpiar formulario y recargar tickets
      setFormData({
        subject: '',
        message: '',
        priority: 'normal'
      });

      await fetchTickets();

    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudo crear el ticket");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'user',
          subject: selectedTicket.subject,
          priority: selectedTicket.priority,
          status: selectedTicket.status
        });

      if (messageError) throw messageError;

      setNewMessage('');
      await fetchMessages(selectedTicket.id);
      await fetchTickets(); // Actualizar contador de mensajes

    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudo enviar el mensaje");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'waiting_response': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedTicket) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header del Chat */}
        <div className="bg-white border-b p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{selectedTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getPriorityColor(selectedTicket.priority)}>
                {selectedTicket.priority}
              </Badge>
              <Badge className={getStatusColor(selectedTicket.status)}>
                {selectedTicket.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDate(selectedTicket.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.message_type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.message_type !== 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.message_type === 'admin' ? 'A' : 'S'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.message_type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatDate(message.created_at)}
                  </p>
                </div>
                {message.message_type === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input de Mensaje */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sendingMessage}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              size="sm"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-12 lg:mt-0">Centro de Soporte</h1>
        <p className="text-gray-600">
          ¿Necesitas ayuda? Estamos aquí para asistirte con cualquier pregunta o problema.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Crear Nueva Consulta
            </CardTitle>
            <CardDescription>
              Describe tu consulta o problema y nuestro equipo te ayudará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Describe brevemente tu consulta"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Proporciona todos los detalles posibles sobre tu consulta o problema..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[120px]"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Crear Consulta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Mis Consultas
            </CardTitle>
            <CardDescription>
              Revisa el estado de tus consultas anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTickets ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes consultas aún</p>
                <p className="text-sm">Crea tu primera consulta usando el formulario</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{ticket.subject}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          {ticket.unread_count > 0 && (
                            <Badge variant="destructive">
                              {ticket.unread_count} nuevo{ticket.unread_count > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.message_count} mensaje{ticket.message_count !== 1 ? 's' : ''} • 
                          {formatDate(ticket.last_message_at || ticket.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportView;
