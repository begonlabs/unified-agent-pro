
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    company_name: string;
    email: string;
  };
}

const SupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSupportMessages();
  }, []);

  const fetchSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles!inner(company_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado del mensaje ha sido actualizado exitosamente.",
      });
      
      fetchSupportMessages();
    } catch (error: any) {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pendiente' },
      in_progress: { variant: 'default' as const, icon: AlertCircle, label: 'En Progreso' },
      resolved: { variant: 'default' as const, icon: CheckCircle, label: 'Resuelto' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const handleViewMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setShowDialog(true);
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
      <Card>
        <CardHeader>
          <CardTitle>Mensajes de Soporte</CardTitle>
          <CardDescription>
            Gestiona las solicitudes de soporte de los clientes
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
                {messages.map((message) => {
                  const statusConfig = getStatusBadge(message.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.profiles?.company_name}</div>
                          <div className="text-sm text-gray-500">{message.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{message.subject}</div>
                          <div className="text-sm text-gray-500 truncate">{message.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(message.priority)}>
                          {message.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(message.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMessage(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMessageStatus(message.id, 'in_progress')}
                            >
                              Atender
                            </Button>
                          )}
                          {message.status === 'in_progress' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateMessageStatus(message.id, 'resolved')}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para ver detalles del mensaje */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Mensaje de Soporte</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de soporte
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedMessage.profiles?.company_name}</div>
                    <div className="text-sm text-gray-500">{selectedMessage.profiles?.email}</div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Prioridad</label>
                  <div className="mt-1">
                    <Badge className={getPriorityBadge(selectedMessage.priority)}>
                      {selectedMessage.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadge(selectedMessage.status).variant}>
                      {getStatusBadge(selectedMessage.status).label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Asunto</label>
                <div className="mt-1 font-medium">{selectedMessage.subject}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Mensaje</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                {selectedMessage.status === 'pending' && (
                  <Button
                    onClick={() => {
                      updateMessageStatus(selectedMessage.id, 'in_progress');
                      setShowDialog(false);
                    }}
                  >
                    Marcar como En Progreso
                  </Button>
                )}
                {selectedMessage.status === 'in_progress' && (
                  <Button
                    onClick={() => {
                      updateMessageStatus(selectedMessage.id, 'resolved');
                      setShowDialog(false);
                    }}
                  >
                    Marcar como Resuelto
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportMessages;
