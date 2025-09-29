import React from 'react';
import { User } from 'lucide-react';
import { MessageBubbleProps } from '../types';
import { SupportService } from '../services/supportService';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAdmin = message.message_type === 'admin';

  return (
    <div className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      {!isAdmin && (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600" />
        </div>
      )}
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isAdmin
            ? 'bg-blue-500 text-white'
            : 'bg-white border shadow-sm'
        }`}
      >
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${
          isAdmin ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {SupportService.formatDate(message.created_at)}
        </p>
      </div>
      {isAdmin && (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-green-600" />
        </div>
      )}
    </div>
  );
};
