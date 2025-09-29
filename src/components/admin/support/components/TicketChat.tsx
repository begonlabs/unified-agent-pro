import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { TicketChatProps } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { MessageBubble } from './MessageBubble';

export const TicketChat: React.FC<TicketChatProps> = ({
  ticket,
  messages,
  loading,
  onClose,
  onSendMessage,
  onStatusUpdate
}) => {
  const [response, setResponse] = React.useState('');

  const handleSendMessage = () => {
    if (response.trim() && ticket) {
      onSendMessage(response.trim());
      setResponse('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!ticket) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chat de Soporte</CardTitle>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <div className="mt-2">
          <h4 className="font-medium">Cliente: {ticket.user_profile?.company_name}</h4>
          <p className="text-sm text-gray-500">{ticket.user_profile?.email}</p>
          <p className="text-sm font-medium mt-1">Asunto: {ticket.subject}</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
          {loading ? (
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
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* Response Input */}
        {ticket.status !== 'closed' && (
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribe tu respuesta aquí..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              rows={3}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!response.trim()}
              className="self-end"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="text-center text-gray-500 py-4">
            Este ticket está cerrado. No se pueden enviar más mensajes.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
