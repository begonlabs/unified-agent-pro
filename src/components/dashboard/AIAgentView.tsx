
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Brain,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  Play,
  Pause
} from 'lucide-react';

const AIAgentView = () => {
  const [agentName, setAgentName] = useState('Asistente ChatBot');
  const [agentObjective, setAgentObjective] = useState('Ayudar a los clientes con consultas sobre productos y servicios');
  const [agentPersonality, setAgentPersonality] = useState('Amigable y profesional');
  const [isActive, setIsActive] = useState(true);
  const [faqs, setFaqs] = useState([
    { id: 1, question: '¿Cuáles son los horarios de atención?', answer: 'Nuestro horario es de lunes a viernes de 9:00 AM a 6:00 PM.' },
    { id: 2, question: '¿Cómo puedo contactar soporte?', answer: 'Puedes contactarnos a través de WhatsApp, email o este chat.' }
  ]);
  const [restrictions, setRestrictions] = useState([
    'No proporcionar información personal de otros clientes',
    'No procesar pagos o información financiera',
    'Derivar consultas complejas a un humano'
  ]);
  const { toast } = useToast();

  const handleSaveAgent = () => {
    toast({
      title: "Agente IA actualizado",
      description: "La configuración de tu agente IA ha sido guardada exitosamente.",
    });
  };

  const addFaq = () => {
    const newFaq = {
      id: Date.now(),
      question: '',
      answer: ''
    };
    setFaqs([...faqs, newFaq]);
  };

  const updateFaq = (id: number, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const deleteFaq = (id: number) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
  };

  const addRestriction = () => {
    setRestrictions([...restrictions, '']);
  };

  const updateRestriction = (index: number, value: string) => {
    const newRestrictions = [...restrictions];
    newRestrictions[index] = value;
    setRestrictions(newRestrictions);
  };

  const deleteRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6 bg-zinc-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-2">Mi Agente IA</h1>
        <p className="text-zinc-400 font-mono tracking-wide">
          Configura y personaliza tu asistente de inteligencia artificial
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent Configuration */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
              <Bot className="h-5 w-5" />
              Configuración del Agente
            </CardTitle>
            <CardDescription className="text-zinc-400 font-mono">
              Define la personalidad y objetivos de tu agente IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-sm border border-zinc-600">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isActive ? 'bg-green-600' : 'bg-zinc-600'}`}>
                  {isActive ? <Play className="h-4 w-4 text-white" /> : <Pause className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <p className="font-mono font-medium text-white">Estado del Agente</p>
                  <p className="text-sm text-zinc-400 font-mono">{isActive ? 'Activo y respondiendo' : 'Pausado'}</p>
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-zinc-300 font-mono uppercase tracking-wider">Nombre del Agente</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-objective" className="text-zinc-300 font-mono uppercase tracking-wider">Objetivo Principal</Label>
              <Textarea
                id="agent-objective"
                value={agentObjective}
                onChange={(e) => setAgentObjective(e.target.value)}
                className="min-h-[100px] bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                placeholder="Describe el objetivo principal de tu agente IA..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-personality" className="text-zinc-300 font-mono uppercase tracking-wider">Personalidad</Label>
              <Input
                id="agent-personality"
                value={agentPersonality}
                onChange={(e) => setAgentPersonality(e.target.value)}
                placeholder="Ej: Amigable, profesional, directo..."
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>

            <Button 
              onClick={handleSaveAgent}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-mono uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
              <Brain className="h-5 w-5" />
              Estadísticas del Agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-zinc-700/30 rounded-sm border border-zinc-600">
                <div className="text-2xl font-mono font-bold text-white">1,902</div>
                <div className="text-sm text-zinc-400 font-mono">Mensajes Enviados</div>
              </div>
              <div className="text-center p-4 bg-zinc-700/30 rounded-sm border border-zinc-600">
                <div className="text-2xl font-mono font-bold text-white">94.5%</div>
                <div className="text-sm text-zinc-400 font-mono">Tasa de Éxito</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-zinc-400">Consultas Resueltas</span>
                <Badge className="bg-green-600 text-white font-mono">1,247</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-zinc-400">Derivadas a Humano</span>
                <Badge variant="outline" className="border-zinc-600 text-zinc-300 font-mono">156</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-zinc-400">Tiempo Promedio</span>
                <Badge variant="outline" className="border-zinc-600 text-zinc-300 font-mono">2.3s</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs Section */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <MessageSquare className="h-5 w-5" />
                Preguntas Frecuentes
              </CardTitle>
              <CardDescription className="text-zinc-400 font-mono">
                Configura respuestas automáticas para consultas comunes
              </CardDescription>
            </div>
            <Button 
              onClick={addFaq}
              size="sm" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-mono"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-4 bg-zinc-700/30 rounded-sm border border-zinc-600 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                    placeholder="Pregunta frecuente..."
                    className="bg-zinc-600/50 border-zinc-500 text-white placeholder:text-zinc-400 font-mono"
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                    placeholder="Respuesta automática..."
                    className="min-h-[80px] bg-zinc-600/50 border-zinc-500 text-white placeholder:text-zinc-400 font-mono"
                  />
                </div>
                <Button
                  onClick={() => deleteFaq(faq.id)}
                  size="sm"
                  variant="outline"
                  className="ml-3 border-red-600 text-red-400 hover:bg-red-600/20 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Restrictions Section */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-mono text-white uppercase tracking-wider">
                <Settings className="h-5 w-5" />
                Restricciones
              </CardTitle>
              <CardDescription className="text-zinc-400 font-mono">
                Define qué puede y no puede hacer tu agente IA
              </CardDescription>
            </div>
            <Button 
              onClick={addRestriction}
              size="sm" 
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-mono"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Restricción
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {restrictions.map((restriction, index) => (
            <div key={index} className="flex gap-3 items-center">
              <Input
                value={restriction}
                onChange={(e) => updateRestriction(index, e.target.value)}
                placeholder="Describe una restricción..."
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
              <Button
                onClick={() => deleteRestriction(index)}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentView;
