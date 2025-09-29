import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GeneralStatsService } from '../services/generalStatsService';
import { Loader2 } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  const skeletonCount = GeneralStatsService.getLoadingSkeletonCount();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(skeletonCount)].map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 mb-4">
                <Loader2 className="h-6 w-6 text-[#3a0caa] animate-spin" />
              </div>
              <p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
