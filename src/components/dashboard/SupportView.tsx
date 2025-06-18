
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, HelpCircle, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SupportView = () => {
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  // Datos de ejemplo - en producción vendrían de la base de datos
  const supportTickets = [
    {
      id: '1',
      subject: 'Problema con integración de WhatsApp',
      status: 'open',
      priority: 'high',
      created_at: '2024-01-15T10:30:00Z',
      messages: [
        {
          id: '1',
          content: 'No puedo conectar mi número de WhatsApp Business. Me aparece un error de autenticación.',
          sender: 'user',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          content: 'Hola! Gracias por contactarnos. Para ayudarte con la integración de WhatsApp, necesitaríamos que verifiques que tu token de API esté actualizado.',
          sender: 'support',
          created_at: '2024-01-15T11:45:00Z'
        }
      ]
    },
    {
      id: '2',
      subject: 'Consulta sobre límites del plan Professional',
      status: 'resolved',
      priority: 'medium',
      created_at: '2024-01-10T14:20:00Z',
      messages: [
        {
          id: '3',
          content: '¿Cuántos mensajes puedo enviar con el plan Professional?',
          sender: 'user',
          created_at: '2024-01-10T14:20:00Z'
        },
        {
          id: '4',
          content: 'El plan Professional incluye hasta 1,000 mensajes mensuales. Si necesitas más, puedes actualizar al plan Enterprise.',
          sender: 'support',
          created_at: '2024-01-10T15:30:00Z'
        }
      ]
    }
  ];

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const createTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // En producción, aquí se enviaría a la base de datos
    toast({
      title: "Ticket creado",
      description: "Tu consulta ha sido enviada. Te responderemos pronto.",
    });

    setNewTicket({ subject: '', message: '' });
  };

  const sendReply = () => {
    if (!replyMessage.trim()) return;

    // En producción, aquí se enviaría la respuesta
    toast({
      title: "Mensaje enviado",
      description: "Tu respuesta ha sido enviada al equipo de soporte.",
    });

    setReplyMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTicketData = supportTickets.find(t => t.id === selectedTicket);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centro de Soporte</h1>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">¿Necesitas ayuda? Estamos aquí para ti</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nuevo Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Crear Nuevo Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asunto</label>
              <Input
                placeholder="Describe brevemente tu consulta"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Describe tu problema o consulta en detalle..."
                rows={4}
                value={newTicket.message}
                onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <Button onClick={createTicket} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Enviar Consulta
            </Button>
          </CardContent>
        </Card>

        {/* Mis Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mis Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket === ticket.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{ticket.subject}</h4>
                      <div className="flex gap-1">
                        <Badge className={getStatusColor(ticket.status)} variant="secondary">
                          {ticket.status}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat del Ticket Seleccionado */}
      {selectedTicketData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedTicketData.subject}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedTicketData.status)}>
                  {selectedTicketData.status}
                </Badge>
                <Badge className={getPriorityColor(selectedTicketData.priority)}>
                  {selectedTicketData.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 mb-4">
              <div className="space-y-4">
                {selectedTicketData.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedTicketData.status === 'open' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu respuesta..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                  className="flex-1"
                />
                <Button onClick={sendReply} disabled={!replyMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">¿Cómo conecto WhatsApp?</h4>
              <p className="text-sm text-gray-600">
                Ve a Configuración > Canales y sigue las instrucciones para conectar tu cuenta de WhatsApp Business.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">¿Puedo cambiar mi plan?</h4>
              <p className="text-sm text-gray-600">
                Sí, puedes cambiar tu plan en cualquier momento desde tu perfil. Los cambios se aplicarán en el siguiente ciclo de facturación.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">¿Cómo entreno mi IA?</h4>
              <p className="text-sm text-gray-600">
                En la sección "Mi Agente IA" puedes configurar objetivos, restricciones y subir documentos para entrenar tu asistente.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">¿Hay límites de mensajes?</h4>
              <p className="text-sm text-gray-600">
                Cada plan tiene límites diferentes. El plan gratuito incluye 100 mensajes, Professional 1,000 y Enterprise es ilimitado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportView;
