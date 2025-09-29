import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GeneralStatsService } from '../services/generalStatsService';

export const LoadingSkeleton: React.FC = () => {
  const skeletonCount = GeneralStatsService.getLoadingSkeletonCount();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(skeletonCount)].map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
