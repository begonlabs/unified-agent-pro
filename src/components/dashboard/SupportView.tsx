
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, HelpCircle, AlertCircle } from 'lucide-react';

const SupportView = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje de soporte ha sido enviado exitosamente. Te responderemos pronto.",
      });

      // Limpiar formulario
      setFormData({
        subject: '',
        message: '',
        priority: 'normal'
      });

    } catch (error: any) {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Soporte</h1>
        <p className="text-gray-600">
          ¿Necesitas ayuda? Estamos aquí para asistirte con cualquier pregunta o problema.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensaje de Soporte
            </CardTitle>
            <CardDescription>
              Describe tu consulta o problema y nuestro equipo te ayudará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Describe brevemente tu consulta"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Proporciona todos los detalles posibles sobre tu consulta o problema..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[120px]"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información de Ayuda */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">¿Cómo conectar WhatsApp?</h4>
                <p className="text-sm text-gray-600">
                  Ve a la sección "Canales", selecciona WhatsApp y sigue las instrucciones para conectar tu número.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">¿Cómo configurar mi IA?</h4>
                <p className="text-sm text-gray-600">
                  En "Mi Agente IA" puedes definir objetivos, restricciones y preguntas frecuentes para personalizar las respuestas.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">¿Cómo ver mis estadísticas?</h4>
                <p className="text-sm text-gray-600">
                  La sección "Estadísticas" te muestra métricas detalladas de mensajes, leads y rendimiento por canal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Tiempo de respuesta</p>
                  <p className="text-sm text-gray-600">Respondemos en menos de 24 horas en días laborables</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Soporte técnico</p>
                  <p className="text-sm text-gray-600">Disponible 24/7 para problemas críticos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Documentación</p>
                  <p className="text-sm text-gray-600">Consulta nuestra guía completa en línea</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportView;
