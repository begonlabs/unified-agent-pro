import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-muted-foreground">Cargando estadísticas...</p>
    </div>
  </div>
);
