import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { MessageBubbleProps } from '../types';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, formatDate }) => {
  const isUserMessage = message.message_type === 'user';
  const isAdminMessage = message.message_type === 'admin';
  const isSystemMessage = message.message_type === 'system';

  return (
    <div className={`flex gap-3 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
      {!isUserMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {isAdminMessage ? 'A' : 'S'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUserMessage
            ? 'bg-blue-500 text-white'
            : 'bg-white border shadow-sm'
        }`}
      >
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${
          isUserMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatDate(message.created_at)}
        </p>
      </div>
      
      {isUserMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
