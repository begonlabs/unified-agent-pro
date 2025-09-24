
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseInsert, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, FileText, MessageSquare, Clock, Target, Shield, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';

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

  // Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      await fetchAIConfig();
    },
    'ai-agent'
  );

  const fetchAIConfig = useCallback(async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', user.id)
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
    } catch (error: unknown) {
      const isConnectionError = (error as Error)?.message?.includes('upstream connect error') || (error as Error)?.message?.includes('503');
      
      if (isConnectionError) {
        toast({
          title: "Error de conexión",
          description: "Problemas de conectividad. Reintentando automáticamente...",
          variant: "destructive",
        });
        
        setTimeout(() => {
          fetchAIConfig();
        }, 3000);
      }
    }
  }, [toast]);

  useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  const saveAIConfig = async () => {
    setLoading(true);
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        });
        return;
      }

      const configData = {
        goals: config.goals,
        restrictions: config.restrictions,
        common_questions: config.common_questions,
        response_time: config.response_time,
        knowledge_base: config.knowledge_base,
        faq: config.faq,
        is_active: config.is_active,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (config.id) {
        // Update existing config - filter by both id AND user_id for security
        result = await supabase
          .from('ai_configurations')
          .update(configData)
          .eq('id', config.id)
          .eq('user_id', user.id);
      } else {
        // Insert new config
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
    } catch (error: unknown) {
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-12 lg:mt-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mi Agente IA</h1>
            <p className="text-sm sm:text-base text-gray-500">Configura y entrena tu asistente inteligente</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Badge variant={config.is_active ? "default" : "secondary"} className="text-xs sm:text-sm w-fit">
            {config.is_active ? "Activo" : "Inactivo"}
          </Badge>
          <Button onClick={saveAIConfig} disabled={loading} className="w-full sm:w-auto text-sm sm:text-base">
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>

      <TooltipProvider>
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="flex w-full bg-white shadow-sm overflow-x-auto justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="goals" className="flex items-center justify-center data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 min-w-[60px] p-3">
                  <Target className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Objetivos</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="restrictions" className="flex items-center justify-center data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 min-w-[60px] p-3">
                  <Shield className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restricciones</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="knowledge" className="flex items-center justify-center data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 min-w-[60px] p-3">
                  <Brain className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conocimiento</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="faq" className="flex items-center justify-center data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 min-w-[60px] p-3">
                  <MessageSquare className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>FAQs</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="settings" className="flex items-center justify-center data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 min-w-[60px] p-3">
                  <Clock className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configuración</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

        <TabsContent value="goals" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                ¿Qué quieres lograr con tu IA?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="goals" className="text-sm sm:text-base">Objetivos de tu Agente IA</Label>
                <Textarea
                  id="goals"
                  placeholder="Ejemplo: Quiero que mi IA ayude a los clientes con consultas sobre productos, tome pedidos básicos y programe citas..."
                  rows={6}
                  value={config.goals}
                  onChange={(e) => setConfig(prev => ({ ...prev, goals: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <h4 className="col-span-full font-medium text-gray-700 mb-2 text-sm sm:text-base">Ejemplos por Industria:</h4>
                {exampleScenarios.map((scenario, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-gray-50 transition-colors" 
                        onClick={() => setConfig(prev => ({ ...prev, goals: scenario.goals, restrictions: scenario.restrictions }))}>
                    <CardContent className="p-3 sm:p-4">
                      <h5 className="font-medium text-sm mb-2">{scenario.title}</h5>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{scenario.goals}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                ¿Qué NO quieres que haga tu IA?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="restrictions" className="text-sm sm:text-base">Restricciones y Límites</Label>
                <Textarea
                  id="restrictions"
                  placeholder="Ejemplo: No responder preguntas personales, no dar información de otros competidores, no confirmar precios sin autorización..."
                  rows={6}
                  value={config.restrictions}
                  onChange={(e) => setConfig(prev => ({ ...prev, restrictions: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">Restricciones Recomendadas:</h4>
                <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
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

        <TabsContent value="knowledge" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Base de Conocimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="knowledge" className="text-sm sm:text-base">Información y Documentos para Entrenar la IA</Label>
                <Textarea
                  id="knowledge"
                  placeholder="Pega aquí información sobre tu empresa, productos, servicios, políticas, etc. También puedes incluir ejemplos de conversaciones exitosas..."
                  rows={8}
                  value={config.knowledge_base}
                  onChange={(e) => setConfig(prev => ({ ...prev, knowledge_base: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">Subir Documentos</p>
                  <p className="text-xs text-gray-400">PDF, DOC, TXT (Próximamente)</p>
                </div>
                <div className="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">Conectar Website</p>
                  <p className="text-xs text-gray-400">Importar contenido web (Próximamente)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="common-questions" className="text-sm sm:text-base">Preguntas Frecuentes de tus Clientes</Label>
                <Textarea
                  id="common-questions"
                  placeholder="Lista las preguntas más comunes que reciben de tus clientes..."
                  rows={4}
                  value={config.common_questions}
                  onChange={(e) => setConfig(prev => ({ ...prev, common_questions: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Respuestas Predefinidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="faq" className="text-sm sm:text-base">Respuestas Frecuentes Personalizadas</Label>
                <Textarea
                  id="faq"
                  placeholder="Formato: Pregunta: ¿Cuáles son sus horarios?&#10;Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.&#10;&#10;Pregunta: ¿Hacen envíos?&#10;Respuesta: Sí, hacemos envíos a todo el país. El tiempo de entrega es de 2-3 días hábiles."
                  rows={10}
                  value={config.faq}
                  onChange={(e) => setConfig(prev => ({ ...prev, faq: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">Formato Recomendado:</h4>
                <pre className="text-xs sm:text-sm text-blue-700 whitespace-pre-wrap overflow-x-auto">
{`Pregunta: ¿Cuáles son sus horarios?
Respuesta: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM.

Pregunta: ¿Hacen envíos?
Respuesta: Sí, hacemos envíos a todo el país.`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Configuración de Comportamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="response-time" className="text-sm sm:text-base">Tiempo de Respuesta (segundos)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[config.response_time]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, response_time: value[0] }))}
                      max={300}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                      <span>5s (Inmediato)</span>
                      <span className="font-medium">{config.response_time}s</span>
                      <span>300s (5 min)</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Tiempo que espera la IA antes de responder automáticamente
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                  <div>
                    <h4 className="font-medium text-sm sm:text-base">Estado del Agente</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Activar o desactivar respuestas automáticas</p>
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

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Estado de Entrenamiento:</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span>Objetivos configurados:</span>
                      <Badge variant={config.goals ? "default" : "secondary"} className="text-xs w-fit">
                        {config.goals ? "Completado" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span>Restricciones definidas:</span>
                      <Badge variant={config.restrictions ? "default" : "secondary"} className="text-xs w-fit">
                        {config.restrictions ? "Completado" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span>Base de conocimiento:</span>
                      <Badge variant={config.knowledge_base ? "default" : "secondary"} className="text-xs w-fit">
                        {config.knowledge_base ? "Completado" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};

export default AIAgentView;
