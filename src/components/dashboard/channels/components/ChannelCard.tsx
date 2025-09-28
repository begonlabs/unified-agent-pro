import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { ChannelCardProps } from '../types';

export const ChannelCard: React.FC<ChannelCardProps> = ({ 
  title, 
  icon: Icon, 
  color, 
  connected, 
  description,
  children 
}) => (
  <Card className="h-full">
    <CardHeader className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant={connected ? "default" : "secondary"} className="flex items-center gap-1 text-xs sm:text-sm w-fit">
          {connected ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Conectado
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Desconectado
            </>
          )}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      {children}
    </CardContent>
  </Card>
);
