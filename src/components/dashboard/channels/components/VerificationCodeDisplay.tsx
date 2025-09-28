import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Copy, Smartphone } from 'lucide-react';
import { VerificationCodeDisplayProps } from '../types';
import { useCountdown } from '../hooks/useCountdown';

export const VerificationCodeDisplay: React.FC<VerificationCodeDisplayProps> = ({ 
  verification, 
  onCopy, 
  isPolling = false 
}) => {
  const countdown = useCountdown(verification.expires_at);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono bg-white px-3 py-2 rounded-lg border-2 border-yellow-300 font-bold">
            {verification.verification_code}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onCopy(verification.verification_code)}
            className="border-yellow-300 hover:bg-yellow-50"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
        </div>
        
        {isPolling && (
          <div className="flex items-center gap-2 text-green-600">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium">Detectando mensaje...</span>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-yellow-800 text-sm">
            {countdown.isExpired ? "Código expirado" : `Tiempo restante: ${countdown.minutes}:${countdown.seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-yellow-700">
            <strong><Smartphone className="inline h-3 w-3 mr-1" /> Instrucciones:</strong> Envía exactamente este código como un mensaje desde tu cuenta de Instagram.
          </p>
          <p className="text-xs text-yellow-700">
            <strong>🤖 Detección automática:</strong> El sistema verificará automáticamente cuando reciba el mensaje.
          </p>
          {isPolling && (
            <p className="text-xs text-green-700 font-medium">
              ⚡ Sistema en espera - Envía el mensaje ahora para completar la verificación
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
