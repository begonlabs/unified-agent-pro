
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, FileText, MessageSquare, Clock, Target, Shield, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIConfig {
  id?: string;
  goals: string;
  restrictions: string;
  common_questions: string;
  response_time: number;
  knowledge_base: string;
  faq: string;
  is_active: boolean;
}

const AIAgentView = () => {
  const [config, setConfig] = useState<AIConfig>({
    goals: '',
    restrictions: '',
    common_questions: '',
    response_time: 30,
    knowledge_base: '',
    faq: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const fetchAIConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig({
          id: data.id,
          goals: data.goals || '',
          restrictions: data.restrictions || '',
          common_questions: data.common_questions || '',
          response_time: data.response_time || 30,
          knowledge_base: data.knowledge_base || '',
          faq: data.faq || '',
          is_active: data.is_active
        });
      }
    } catch (error: any) {
      console.error('Error fetching AI config:', error);
    }
  };

  const saveAIConfig = async () => {
    setLoading(true);
    try {
      const configData = {
        goals: config.goals,
        restrictions: config.restrictions,
        common_questions: config.common_questions,
        response_time: config.response_time,
        knowledge_base: config.knowledge_base,
        faq: config.faq,
        is_active: config.is_active,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (config.id) {
        result = await supabase
          .from('ai_configurations')
          .update(configData)
          .eq('id', config.id);
      } else {
        result = await supabase
          .from('ai_configurations')
          .insert(configData);
      }

      if (result.error) throw result.error;

      await fetchAIConfig();
      toast({
        title: "Configuración guardada",
        description: "Tu agente de IA ha sido actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleScenarios = [
    {
      title: "Atención al Cliente E-commerce",
      goals: "Ayudar a los clientes con consultas sobre productos, pedidos, devoluciones y soporte técnico básico",
      restrictions: "No proporcionar información sobre otros competidores, no hacer promesas sobre envíos que no puedo cumplir"
    },
    {
      title: "Agencia Inmobiliaria",
      goals: "Calificar leads, programar visitas, proporcionar información básica sobre propiedades disponibles",
      restrictions: "No negociar precios sin autorización, no confirmar fechas sin verificar disponibilidad"
    },
    {
      title: "Restaurante",
      goals: "Tomar reservas, informar sobre el menú, responder horarios y ubicación",
      restrictions: "No confirmar disponibilidad de platos sin verificar con cocina, no tomar pedidos de delivery"
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mi Agente IA</h1>
            <p className="text-gray-500">Configura y entrena tu asistente inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.is_active ? "default" : "secondary"}>
            {config.is_active ? "Activo" : "Inactivo"}
          </Badge>
          <Button onClick={saveAIConfig} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
          <TabsTrigger value="restrictions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Restricciones
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Conocimiento
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                ¿Qué quieres lograr con tu IA?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goals">Objetivos de tu Agente IA</Label>
                <Textarea
                  id="goals"
                  placeholder="Ejemplo: Quiero que mi IA ayude a los clientes con consultas sobre productos, tome pedidos básicos y programe citas..."
                  rows={6}
                  value={config.goals}
                  onChange={(e) => setConfig(prev => ({ ...prev, goals: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <h4 className="col-span-full font-medium text-gray-700 mb-2">Ejemplos por Industria:</h4>
                {exampleScenarios.map((scenario, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-gray-50" 
                        onClick={() => setConfig(prev => ({ ...prev, goals: scenario.goals, restrictions: scenario.restrictions }))}>
                    <CardContent className="p-4">
                      <h5 className="font-medium text-sm mb-2">{scenario.title}</h5>
                      <p className="text-xs text-gray-600 line-clamp-3">{scenario.goals}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                ¿Qué NO quieres que haga tu IA?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restrictions">Restricciones y Límites</Label>
                <Textarea
                  id="restrictions"
                  placeholder="Ejemplo: No responder preguntas personales, no dar información de otros competidores, no confirmar precios sin autorización..."
                  rows={6}
                  value={config.restrictions}
                  onChange={(e) => setConfig(prev => ({ ...prev, restrictions: e.target.value }))}
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Restricciones Recomendadas:</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>No compartir información confidencial de la empresa</li>
                  <li>No hacer promesas que no se pueden cumplir</li>
                  <li>No responder temas políticos o controvertidos</li>
                  <li>No intentar diagnosticar problemas médicos o legales</li>
                  <li>Derivar consultas complejas a un humano</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Base de Conocimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="knowledge">Información y Documentos para Entrenar la IA</Label>
                <Textarea
                  id="knowledge"
                  placeholder="Pega aquí información sobre tu empresa, productos, servicios, políticas, etc. También puedes incluir ejemplos de conversaciones exitosas..."
                  rows={8}
                  value={config.knowledge_base}
                  onChange={(e) => setConfig(prev => ({ ...prev, knowledge_base: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Subir Documentos</p>
                  <p className="text-xs text-gray-400">PDF, DOC, TXT (Próximamente)</p>
                </div>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Conectar Website</p>
                  <p className="text-xs text-gray-400">Importar contenido web (Próximamente)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="common-questions">Preguntas Frecuentes de tus Clientes</Label>
                <Textarea
                  id="common-questions"
                  placeholder="Lista las preguntas más comunes que reciben de tus clientes..."
                  rows={4}
                  value={config.common_questions}
                  onChange={(e) => setConfig(prev => ({ ...prev, common_questions: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Respuestas Predefinidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faq">Respuestas Frecuentes Personalizadas</Label>
                <Textarea
                  id="faq"
                  placeholder="Formato: Pregunta: ¿Cuáles son sus horarios?&#10;Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.&#10;&#10;Pregunta: ¿Hacen envíos?&#10;Respuesta: Sí, hacemos envíos a todo el país. El tiempo de entrega es de 2-3 días hábiles."
                  rows={10}
                  value={config.faq}
                  onChange={(e) => setConfig(prev => ({ ...prev, faq: e.target.value }))}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Formato Recomendado:</h4>
                <pre className="text-sm text-blue-700 whitespace-pre-wrap">
{`Pregunta: ¿Cuáles son sus horarios?
Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.

Pregunta: ¿Hacen envíos?
Respuesta: Sí, hacemos envíos a todo el país.`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Configuración de Comportamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="response-time">Tiempo de Respuesta (segundos)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[config.response_time]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, response_time: value[0] }))}
                      max={300}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5s (Inmediato)</span>
                      <span className="font-medium">{config.response_time}s</span>
                      <span>300s (5 min)</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Tiempo que espera la IA antes de responder automáticamente
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Estado del Agente</h4>
                    <p className="text-sm text-gray-500">Activar o desactivar respuestas automáticas</p>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.is_active ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Estado de Entrenamiento:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Objetivos configurados:</span>
                      <Badge variant={config.goals ? "default" : "secondary"}>
                        {config.goals ? "✓ Completado" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Restricciones definidas:</span>
                      <Badge variant={config.restrictions ? "default" : "secondary"}>
                        {config.restrictions ? "✓ Completado" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Base de conocimiento:</span>
                      <Badge variant={config.knowledge_base ? "default" : "secondary"}>
                        {config.knowledge_base ? "✓ Completado" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentView;
