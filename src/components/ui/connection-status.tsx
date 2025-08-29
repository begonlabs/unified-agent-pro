import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
  showDetails = false,
  className = ""
}) => {
  const { isConnected, isConnecting, lastConnected, reconnectAttempts } = status;

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    if (isConnected) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <AlertCircle className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (isConnecting) {
      return reconnectAttempts > 0 ? `Reconectando... (${reconnectAttempts})` : 'Conectando...';
    }
    if (isConnected) {
      return 'Tiempo real activo';
    }
    return 'Desconectado';
  };

  const getStatusVariant = () => {
    if (isConnecting) return 'secondary';
    if (isConnected) return 'default';
    return 'destructive';
  };

  const getTooltipContent = () => {
    if (isConnected && lastConnected) {
      return `Conectado desde ${lastConnected.toLocaleTimeString()}`;
    }
    if (isConnecting) {
      return `Intentando conectar... (intento ${reconnectAttempts})`;
    }
    return 'Sin conexión en tiempo real. Los datos pueden no estar actualizados.';
  };

  if (!showDetails) {
    // Versión compacta solo con icono
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : isConnecting ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versión completa con detalles
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {!isConnected && !isConnecting && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-6 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reconectar
        </Button>
      )}
    </div>
  );
};

// Componente específico para el header de conversaciones
export const ConversationConnectionStatus: React.FC<{
  status: ConnectionStatus;
  onReconnect?: () => void;
}> = ({ status, onReconnect }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <ConnectionStatusIndicator 
        status={status} 
        onReconnect={onReconnect}
        showDetails={true}
      />
    </div>
  );
};

// Componente para mostrar en el sidebar
export const SidebarConnectionStatus: React.FC<{
  status: ConnectionStatus;
}> = ({ status }) => {
  return (
    <div className="flex items-center justify-between p-2 text-xs">
      <span className="text-muted-foreground">Estado:</span>
      <ConnectionStatusIndicator 
        status={status}
        className="ml-2"
      />
    </div>
  );
};
