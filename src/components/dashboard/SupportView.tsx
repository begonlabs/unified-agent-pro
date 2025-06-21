
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
    <div className="p-6 max-w-4xl mx-auto bg-zinc-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-2">Centro de Soporte</h1>
        <p className="text-zinc-400 font-mono tracking-wide">
          ¿Necesitas ayuda? Estamos aquí para asistirte con cualquier pregunta o problema.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de Contacto */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensaje de Soporte
            </CardTitle>
            <CardDescription className="text-zinc-400 font-mono">
              Describe tu consulta o problema y nuestro equipo te ayudará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="subject" className="text-zinc-300 font-mono uppercase tracking-wider">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Describe brevemente tu consulta"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-zinc-300 font-mono uppercase tracking-wider">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-white font-mono">
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="low" className="text-white font-mono">Baja</SelectItem>
                    <SelectItem value="normal" className="text-white font-mono">Normal</SelectItem>
                    <SelectItem value="high" className="text-white font-mono">Alta</SelectItem>
                    <SelectItem value="urgent" className="text-white font-mono">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="text-zinc-300 font-mono uppercase tracking-wider">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Proporciona todos los detalles posibles sobre tu consulta o problema..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[120px] bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-mono uppercase tracking-wider" 
                disabled={loading}
              >
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
          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <HelpCircle className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-mono font-medium mb-2 text-white">¿Cómo conectar WhatsApp?</h4>
                <p className="text-sm text-zinc-400 font-mono">
                  Ve a la sección "Canales", selecciona WhatsApp y sigue las instrucciones para conectar tu número.
                </p>
              </div>
              
              <div>
                <h4 className="font-mono font-medium mb-2 text-white">¿Cómo configurar mi IA?</h4>
                <p className="text-sm text-zinc-400 font-mono">
                  En "Mi Agente IA" puedes definir objetivos, restricciones y preguntas frecuentes para personalizar las respuestas.
                </p>
              </div>
              
              <div>
                <h4 className="font-mono font-medium mb-2 text-white">¿Cómo ver mis estadísticas?</h4>
                <p className="text-sm text-zinc-400 font-mono">
                  La sección "Estadísticas" te muestra métricas detalladas de mensajes, leads y rendimiento por canal.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <AlertCircle className="h-5 w-5" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Tiempo de respuesta</p>
                  <p className="text-sm text-zinc-400 font-mono">Respondemos en menos de 24 horas en días laborables</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Soporte técnico</p>
                  <p className="text-sm text-zinc-400 font-mono">Disponible 24/7 para problemas críticos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Documentación</p>
                  <p className="text-sm text-zinc-400 font-mono">Consulta nuestra guía completa en línea</p>
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
