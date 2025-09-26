
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  unread_count: number;
  user_profile?: {
    company_name: string;
    email: string;
  };
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

const SupportMessages = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener todos los tickets con información del usuario
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          id,
          user_id,
          subject,
          priority,
          status,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Obtener información de perfiles de usuario
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('company_name, email')
            .eq('user_id', ticket.user_id)
            .single();

          // Obtener contadores de mensajes
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('id, created_at, message_type, is_read')
            .eq('ticket_id', ticket.id);

          const messageCount = messagesData?.length || 0;
          const lastMessageAt = messagesData?.length > 0 
            ? messagesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : ticket.created_at;
          const unreadCount = messagesData?.filter(m => m.message_type !== 'user' && !m.is_read).length || 0;

          return {
            ...ticket,
            priority: ticket.priority as 'low' | 'normal' | 'high' | 'urgent',
            status: ticket.status as 'open' | 'in_progress' | 'waiting_response' | 'closed',
            message_count: messageCount,
            last_message_at: lastMessageAt,
            unread_count: unreadCount,
            user_profile: profileData ? {
              company_name: profileData.company_name || 'Sin nombre',
              email: profileData.email || 'Sin email'
            } : undefined
          };
        })
      );

      setTickets(ticketsWithProfiles);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al cargar tickets",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

      if (error) throw error;

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al cargar mensajes",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket, fetchMessages]);

  const updateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'waiting_response' | 'closed') => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
          : ticket
      ));

      toast({
        title: "Estado actualizado",
        description: `El ticket ha sido marcado como ${newStatus}.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al actualizar estado",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const sendResponse = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: selectedTicket.user_id,
          message: response.trim(),
          message_type: 'admin',
          subject: selectedTicket.subject,
          priority: selectedTicket.priority,
          status: selectedTicket.status
        });

      if (error) throw error;

      toast({
        title: "Respuesta enviada",
        description: "La respuesta ha sido enviada al cliente.",
      });
      
      setResponse('');
      await fetchMessages(selectedTicket.id);
      await fetchTickets(); // Actualizar contadores
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al enviar respuesta",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Abierto' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'En Progreso' },
      waiting_response: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Esperando Respuesta' },
      closed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Cerrado' }
    };
    const variant = variants[status as keyof typeof variants] || variants.open;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    const texts = {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.normal}>
        {texts[priority as keyof typeof texts] || priority}
      </Badge>
    );
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Tickets */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'closed').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Soporte</CardTitle>
          <CardDescription>
            Gestiona todos los tickets de soporte de los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por asunto, empresa o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="waiting_response">Esperando Respuesta</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchTickets}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mensajes</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.user_profile?.company_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.user_profile?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{ticket.subject}</div>
                        {ticket.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            {ticket.unread_count} nuevo{ticket.unread_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ticket.message_count} mensaje{ticket.message_count !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.last_message_at || ticket.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          Ver Chat
                        </Button>
                        {ticket.status !== 'closed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateTicketStatus(
                              ticket.id,
                              ticket.status === 'open' ? 'in_progress' : 'closed'
                            )}
                          >
                            {ticket.status === 'open' ? 'Tomar' : 'Cerrar'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Chat del Ticket */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chat de Soporte</CardTitle>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Cerrar
              </Button>
            </div>
            <div className="mt-2">
              <h4 className="font-medium">Cliente: {selectedTicket.user_profile?.company_name}</h4>
              <p className="text-sm text-gray-500">{selectedTicket.user_profile?.email}</p>
              <p className="text-sm font-medium mt-1">Asunto: {selectedTicket.subject}</p>
            </div>
          </CardHeader>
          <CardContent>
            {/* Área de Mensajes */}
            <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay mensajes en este ticket
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.message_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.message_type !== 'admin' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.message_type === 'admin'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.message_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.message_type === 'admin' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                      )}
            </div>
                  ))}
            </div>
              )}
            </div>

            {/* Input de Respuesta */}
            {selectedTicket.status !== 'closed' && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button 
                  onClick={sendResponse} 
                  disabled={!response.trim()}
                  className="self-end"
                >
                    <Send className="w-4 h-4 mr-2" />
                  Enviar
                  </Button>
              </div>
            )}

            {selectedTicket.status === 'closed' && (
              <div className="text-center text-gray-500 py-4">
                Este ticket está cerrado. No se pueden enviar más mensajes.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportMessages;
