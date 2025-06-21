
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  User,
  Calendar
} from 'lucide-react';

interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user_profile?: {
    company_name: string;
    email: string;
  };
}

const SupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [response, setResponse] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSupportMessages();
  }, []);

  const fetchSupportMessages = async () => {
    try {
      // Simulando datos ya que no existe la tabla support_messages
      const mockMessages: SupportMessage[] = [
        {
          id: '1',
          user_id: 'user1',
          subject: 'Problema con integración de WhatsApp',
          message: 'No puedo conectar mi número de WhatsApp Business con la plataforma. ¿Podrían ayudarme?',
          status: 'open',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: {
            company_name: 'Empresa ABC',
            email: 'contacto@empresaabc.com'
          }
        },
        {
          id: '2',
          user_id: 'user2',
          subject: 'Consulta sobre límites del plan Premium',
          message: 'Quisiera saber cuáles son los límites exactos de mensajes en el plan Premium.',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          user_profile: {
            company_name: 'Tech Solutions',
            email: 'admin@techsolutions.com'
          }
        },
        {
          id: '3',
          user_id: 'user3',
          subject: 'Error en estadísticas',
          message: 'Las estadísticas de leads no se están actualizando correctamente desde ayer.',
          status: 'resolved',
          priority: 'medium',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          user_profile: {
            company_name: 'Marketing Pro',
            email: 'soporte@marketingpro.com'
          }
        }
      ];

      setMessages(mockMessages);
    } catch (error: any) {
      toast({
        title: "Error al cargar mensajes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      // Aquí se actualizaría en la base de datos
      setMessages(messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: newStatus, updated_at: new Date().toISOString() }
          : msg
      ));

      toast({
        title: "Estado actualizado",
        description: `El mensaje ha sido marcado como ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendResponse = async () => {
    if (!selectedMessage || !response.trim()) return;

    try {
      // Aquí se enviaría la respuesta
      toast({
        title: "Respuesta enviada",
        description: "La respuesta ha sido enviada al cliente.",
      });
      
      setResponse('');
      updateMessageStatus(selectedMessage.id, 'resolved');
      setSelectedMessage(null);
    } catch (error: any) {
      toast({
        title: "Error al enviar respuesta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    const variant = variants[status as keyof typeof variants];
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'open' ? 'Abierto' : status === 'in_progress' ? 'En Progreso' : 'Resuelto'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : 'Alta'}
      </Badge>
    );
  };

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
      {/* Resumen de Mensajes */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.filter(m => m.status === 'open').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.filter(m => m.status === 'in_progress').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.filter(m => m.status === 'resolved').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes de Soporte</CardTitle>
          <CardDescription>
            Gestiona todos los mensajes de soporte de los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{message.user_profile?.company_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {message.user_profile?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{message.subject}</div>
                        <div className="text-sm text-gray-500 truncate">{message.message}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(message.priority)}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          Ver
                        </Button>
                        {message.status !== 'resolved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateMessageStatus(
                              message.id,
                              message.status === 'open' ? 'in_progress' : 'resolved'
                            )}
                          >
                            {message.status === 'open' ? 'Tomar' : 'Resolver'}
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

      {/* Modal de Detalle del Mensaje */}
      {selectedMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle del Mensaje</CardTitle>
            <div className="flex gap-2">
              {getStatusBadge(selectedMessage.status)}
              {getPriorityBadge(selectedMessage.priority)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Cliente:</h4>
              <p>{selectedMessage.user_profile?.company_name} ({selectedMessage.user_profile?.email})</p>
            </div>
            
            <div>
              <h4 className="font-medium">Asunto:</h4>
              <p>{selectedMessage.subject}</p>
            </div>
            
            <div>
              <h4 className="font-medium">Mensaje:</h4>
              <p className="bg-gray-50 p-3 rounded-md">{selectedMessage.message}</p>
            </div>

            {selectedMessage.status !== 'resolved' && (
              <div>
                <h4 className="font-medium mb-2">Responder:</h4>
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button onClick={sendResponse} disabled={!response.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Respuesta
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}

            {selectedMessage.status === 'resolved' && (
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Cerrar
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportMessages;
