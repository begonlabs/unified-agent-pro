import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-48">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No se pudieron cargar las estadísticas</p>
          <button 
            onClick={onRetry}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Reintentar
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
