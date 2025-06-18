
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Video, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SupportView = () => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const faqItems = [
    {
      question: "¿Cómo conectar WhatsApp Business?",
      answer: "Ve a la sección 'Canales', selecciona WhatsApp y sigue las instrucciones para vincular tu cuenta de WhatsApp Business."
    },
    {
      question: "¿Cómo entrenar mi agente de IA?",
      answer: "En 'Mi Agente IA' puedes definir objetivos, restricciones y cargar tu base de conocimientos para personalizar las respuestas."
    },
    {
      question: "¿Cuántos mensajes incluye cada plan?",
      answer: "Plan Free: 100 mensajes/mes, Plan Professional: 1,000 mensajes/mes, Plan Enterprise: mensajes ilimitados."
    },
    {
      question: "¿Cómo cambiar mi plan?",
      answer: "Ve a tu perfil y selecciona 'Cambiar Plan'. Los cambios se aplican inmediatamente."
    }
  ];

  const tutorials = [
    {
      title: "Configuración inicial",
      description: "Aprende a configurar tu cuenta y conectar tus primeros canales",
      duration: "5 min",
      type: "video"
    },
    {
      title: "Entrenamiento de IA",
      description: "Cómo personalizar tu agente de IA para tu negocio",
      duration: "8 min",
      type: "video"
    },
    {
      title: "Gestión de leads",
      description: "Organiza y convierte tus leads efectivamente",
      duration: "6 min",
      type: "guide"
    },
    {
      title: "Análisis de métricas",
      description: "Interpreta tus estadísticas para mejorar resultados",
      duration: "4 min",
      type: "guide"
    }
  ];

  const supportTickets = [
    {
      id: "TICK-001",
      subject: "Problema con conexión de Facebook",
      status: "en_progreso",
      created: "2024-01-15",
      lastUpdate: "2024-01-16"
    },
    {
      id: "TICK-002",
      subject: "Consulta sobre facturación",
      status: "resuelto",
      created: "2024-01-10",
      lastUpdate: "2024-01-12"
    }
  ];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular envío de ticket
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Ticket creado exitosamente",
        description: "Te contactaremos dentro de 24 horas.",
      });
      
      setTicketSubject('');
      setTicketMessage('');
    } catch (error) {
      toast({
        title: "Error al crear ticket",
        description: "Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_progreso':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En Progreso</Badge>;
      case 'resuelto':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Resuelto</Badge>;
      default:
        return <Badge variant="secondary">Abierto</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centro de Soporte</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat en Vivo
          </Button>
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" />
            Llamar
          </Button>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Chat en Vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Habla directamente con nuestro equipo de soporte
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              En línea
            </div>
            <Button className="w-full">Iniciar Chat</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Respuesta en menos de 4 horas
            </p>
            <p className="text-sm text-gray-500 mb-4">
              support@chatbotai.com
            </p>
            <Button variant="outline" className="w-full">Enviar Email</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Teléfono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Lunes a Viernes 9:00 - 18:00
            </p>
            <p className="text-sm text-gray-500 mb-4">
              +1 (555) 123-4567
            </p>
            <Button variant="outline" className="w-full">Llamar Ahora</Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Ticket Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Ticket de Soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asunto</label>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Describe brevemente tu problema"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <Textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe detalladamente tu problema o consulta"
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Enviando...' : 'Crear Ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Tickets */}
      {supportTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{ticket.id}</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-medium mb-2">{ticket.subject}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Creado: {ticket.created}</span>
                    <span>Última actualización: {ticket.lastUpdate}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium mb-2">{item.question}</h4>
                <p className="text-gray-600 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tutorials and Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Tutoriales y Guías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorials.map((tutorial, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tutorial.type === 'video' ? (
                      <Video className="h-4 w-4 text-red-600" />
                    ) : (
                      <Book className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm text-gray-500">{tutorial.type}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {tutorial.duration}
                  </div>
                </div>
                <h4 className="font-medium mb-1">{tutorial.title}</h4>
                <p className="text-sm text-gray-600">{tutorial.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportView;
