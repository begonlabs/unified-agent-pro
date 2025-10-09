import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useWelcomeEmail } from '@/hooks/useWelcomeEmail';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeEmailDemoProps {
  className?: string;
}

export const WelcomeEmailDemo: React.FC<WelcomeEmailDemoProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { sendWelcomeEmail } = useWelcomeEmail();
  const { user } = useAuth();

  const handleSendWelcomeEmail = async () => {
    if (!email || !name) {
      return;
    }

    setSending(true);
    try {
      const success = await sendWelcomeEmail({
        userId: user?.id || 'demo-user',
        userName: name,
        userEmail: email
      });

      if (success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setEmail('');
          setName('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Demo: Correo de Bienvenida
        </CardTitle>
        <p className="text-sm text-gray-600">
          Prueba el correo de bienvenida personalizado con el logo de OndAI
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Usuario</Label>
          <Input
            id="name"
            placeholder="Ej: Juan Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sending || sent}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email del Usuario</Label>
          <Input
            id="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending || sent}
          />
        </div>

        <Button 
          onClick={handleSendWelcomeEmail}
          disabled={!email || !name || sending || sent}
          className="w-full gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ¡Enviado!
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Correo de Bienvenida
            </>
          )}
        </Button>

        {sent && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Correo de bienvenida enviado exitosamente a {email}
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Características del Correo:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 🎨 Diseño responsivo y profesional</li>
            <li>• 🏷️ Logo de OndAI integrado</li>
            <li>• 🎯 Call-to-action para configurar agente IA</li>
            <li>• 📱 Compatible con todos los clientes de email</li>
            <li>• 🌈 Gradientes y colores de marca</li>
            <li>• 📋 Pasos claros para comenzar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
