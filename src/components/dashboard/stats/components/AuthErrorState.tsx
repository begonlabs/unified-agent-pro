import React from 'react';

export const AuthErrorState: React.FC = () => (
  <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No autenticado</h2>
        <p className="text-muted-foreground mb-4">Debes iniciar sesión para ver las estadísticas</p>
      </div>
    </div>
  </div>
);
