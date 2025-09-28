import React from 'react';

export const AuthLoadingState: React.FC = () => (
  <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Verificando autenticación...</p>
      </div>
    </div>
  </div>
);
