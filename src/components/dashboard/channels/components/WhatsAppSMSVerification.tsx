// src/components/dashboard/channels/components/WhatsAppSMSVerification.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppVerificationSuccessData {
  success: boolean;
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  message: string;
}

interface WhatsAppSMSVerificationProps {
  userId: string;
  onSuccess: (data: WhatsAppVerificationSuccessData) => void;
  onCancel: () => void;
}

export const WhatsAppSMSVerification: React.FC<WhatsAppSMSVerificationProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSendSMS = async () => {
    if (!phoneNumber || !countryCode) {
      setError('Por favor ingresa tu número de teléfono');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/functions/v1/whatsapp-sms-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          country_code: countryCode,
          user_id: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationId(data.verification_id);
        setStep('verify');
        toast({
          title: 'Código enviado',
          description: 'Hemos enviado un código de verificación por SMS',
        });
      } else {
        setError(data.error || 'Error al enviar el código SMS');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !verificationId) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/functions/v1/whatsapp-verify-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_id: verificationId,
          verification_code: verificationCode,
          user_id: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '¡Conectado exitosamente!',
          description: 'WhatsApp Cloud API configurado correctamente',
        });
        onSuccess(data);
      } else {
        setError(data.error || 'Código de verificación inválido');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setStep('phone');
    setVerificationCode('');
    setVerificationId('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-green-600" />
          Verificación WhatsApp Cloud API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="country-code">Código de País</Label>
              <Input
                id="country-code"
                placeholder="+1"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone-number">Número de Teléfono</Label>
              <Input
                id="phone-number"
                placeholder="1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Recibirás un código de verificación por SMS para configurar WhatsApp Cloud API
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSendSMS}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Código SMS'
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-sm text-gray-600">
                Código enviado a {countryCode}{phoneNumber}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Código de Verificación</Label>
              <Input
                id="verification-code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>
              <Button variant="outline" onClick={handleResendCode}>
                Reenviar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
