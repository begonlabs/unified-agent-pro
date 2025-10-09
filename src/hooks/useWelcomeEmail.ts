import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendWelcomeEmailParams {
  userId: string;
  userName: string;
  userEmail: string;
}

export const useWelcomeEmail = () => {
  const { toast } = useToast();

  const sendWelcomeEmail = useCallback(async ({ 
    userId, 
    userName, 
    userEmail 
  }: SendWelcomeEmailParams): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          userId,
          userName,
          userEmail
        }
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el correo de bienvenida",
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "¡Correo enviado!",
          description: "El correo de bienvenida ha sido enviado exitosamente",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Welcome email error:', error);
      toast({
        title: "Error",
        description: "Error al enviar el correo de bienvenida",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    sendWelcomeEmail
  };
};
