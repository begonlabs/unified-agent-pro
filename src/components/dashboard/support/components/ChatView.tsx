import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send } from 'lucide-react';
import { ChatViewProps } from '../types';
import { MessageBubble } from './MessageBubble';

export const ChatView: React.FC<ChatViewProps> = ({
  ticket,
  messages,
  newMessage,
  loadingMessages,
  sendingMessage,
  onBack,
  onMessageChange,
  onSendMessage,
  getPriorityColor,
  getStatusColor,
  formatDate
}) => (
  <div className="h-screen flex flex-col bg-gray-50">
    {/* Header del Chat */}
    <div className="bg-white border-b p-4 flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>
      <div className="flex-1">
        <h2 className="font-semibold text-lg">{ticket.subject}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
          <span className="text-sm text-gray-500">
            {formatDate(ticket.created_at)}
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
          <MessageBubble
            key={message.id}
            message={message}
            formatDate={formatDate}
          />
        ))
      )}
    </div>

    {/* Input de Mensaje */}
    <div className="bg-white border-t p-4">
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          disabled={sendingMessage}
        />
        <Button
          onClick={onSendMessage}
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
