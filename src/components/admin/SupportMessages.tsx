
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Send,
  User
} from 'lucide-react';

interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  user_email?: string;
}

const SupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSupportMessages();
  }, []);

  const fetchSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Simular email del usuario para los datos de ejemplo
      const messagesWithUserData = (data || []).map(msg => ({
        ...msg,
        user_email: `user${msg.user_id.substring(0, 8)}@example.com`
      }));

      setMessages(messagesWithUserData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes de soporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status: newStatus } : msg
      ));

      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }

      toast({
        title: "Estado actualizado",
        description: `El mensaje ha sido marcado como ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del mensaje",
        variant: "destructive",
      });
    }
  };

  const sendResponse = async () => {
    if (!response.trim() || !selectedMessage) return;

    try {
      // Aquí se enviaría la respuesta al usuario
      // Por ahora solo actualizamos el estado
      await updateMessageStatus(selectedMessage.id, 'resolved');
      setResponse('');
      
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada al usuario",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'normal': return 'bg-blue-600 text-white';
      case 'low': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'in_progress': return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      default: return 'Desconocido';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    inProgress: messages.filter(m => m.status === 'in_progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length
  };

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="font-mono text-zinc-400 tracking-wider uppercase">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-mono font-black uppercase tracking-widest text-white">Gestión de Soporte</h2>
        <p className="text-zinc-400 font-mono tracking-wide">
          Administra y responde a los mensajes de soporte de los usuarios
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{stats.total}</div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Mensajes totales</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{stats.pending}</div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">En Progreso</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{stats.inProgress}</div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Siendo atendidos</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{stats.resolved}</div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Completados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-white uppercase tracking-wider">Mensajes de Soporte</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Buscar mensajes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-zinc-700/50 border-zinc-600 text-white font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all" className="text-white font-mono">Todos</SelectItem>
                      <SelectItem value="pending" className="text-white font-mono">Pendientes</SelectItem>
                      <SelectItem value="in_progress" className="text-white font-mono">En Progreso</SelectItem>
                      <SelectItem value="resolved" className="text-white font-mono">Resueltos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-sm border cursor-pointer transition-all duration-300 ${
                      selectedMessage?.id === message.id
                        ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50'
                        : 'bg-zinc-700/30 border-zinc-600 hover:bg-zinc-700/50 hover:border-zinc-500'
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-mono font-bold">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-medium text-white truncate">{message.subject}</h3>
                            <Badge className={`${getPriorityColor(message.priority)} font-mono text-xs`}>
                              {message.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 font-mono truncate">{message.user_email}</p>
                          <p className="text-sm text-zinc-500 font-mono truncate mt-1">{message.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusIcon(message.status)}
                            <span className="text-xs text-zinc-400 font-mono">{getStatusText(message.status)}</span>
                            <span className="text-xs text-zinc-500 font-mono">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div>
          {selectedMessage ? (
            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-mono text-white uppercase tracking-wider">Detalles del Mensaje</CardTitle>
                <CardDescription className="text-zinc-400 font-mono">
                  Responde al usuario y gestiona el estado del mensaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">De:</label>
                    <p className="font-mono text-white">{selectedMessage.user_email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Asunto:</label>
                    <p className="font-mono text-white">{selectedMessage.subject}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Mensaje:</label>
                    <div className="p-3 bg-zinc-700/30 rounded-sm border border-zinc-600">
                      <p className="font-mono text-white text-sm">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge className={`${getPriorityColor(selectedMessage.priority)} font-mono`}>
                      {selectedMessage.priority.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedMessage.status)}
                      <Badge variant="outline" className="border-zinc-600 text-zinc-300 font-mono">
                        {getStatusText(selectedMessage.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Cambiar Estado:</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(selectedMessage.id, 'in_progress')}
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20 font-mono"
                    >
                      En Progreso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMessageStatus(selectedMessage.id, 'resolved')}
                      className="border-green-600 text-green-400 hover:bg-green-600/20 font-mono"
                    >
                      Resolver
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Respuesta:</label>
                  <Textarea
                    placeholder="Escribe tu respuesta al usuario..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="min-h-[120px] bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                  />
                  <Button
                    onClick={sendResponse}
                    disabled={!response.trim()}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 font-mono uppercase tracking-wider"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Respuesta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-mono font-medium text-white mb-2 uppercase tracking-wider">
                    Selecciona un Mensaje
                  </h3>
                  <p className="text-zinc-400 font-mono">
                    Elige un mensaje para ver los detalles y responder
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportMessages;
