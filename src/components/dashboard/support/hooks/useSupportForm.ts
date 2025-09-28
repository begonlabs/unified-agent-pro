import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SupportService } from '../services/supportService';
import { SupportFormData, User } from '../types';

export const useSupportForm = (user: User | null) => {
  const [formData, setFormData] = useState<SupportFormData>({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateFormData = useCallback((newFormData: SupportFormData) => {
    setFormData(newFormData);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      subject: '',
      message: '',
      priority: 'normal'
    });
  }, []);

  const submitTicket = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear un ticket",
        variant: "destructive",
      });
      return;
    }

    // Validate form data
    const validation = SupportService.validateFormData(formData);
    if (!validation.isValid) {
      toast({
        title: "Error de validación",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🎫 Creating support ticket:', formData.subject);
      
      await SupportService.createTicket(formData, user);
      
      toast({
        title: "Ticket creado",
        description: "Tu consulta ha sido enviada exitosamente. Te responderemos pronto.",
      });

      // Reset form after successful submission
      resetForm();
      
    } catch (error: unknown) {
      const errorInfo = SupportService.handleSupabaseError(error, "No se pudo crear el ticket");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, formData, toast, resetForm]);

  return {
    formData,
    loading,
    updateFormData,
    resetForm,
    submitTicket
  };
};
