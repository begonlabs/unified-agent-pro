
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Mensajería Unificada',
      description: 'Centraliza WhatsApp, Facebook e Instagram en una sola plataforma',
      color: 'text-blue-600'
    },
    {
      icon: Bot,
      title: 'IA Personalizada',
      description: 'Automatización inteligente que aprende de tu negocio',
      color: 'text-green-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avanzados',
      description: 'Métricas en tiempo real para optimizar tu operación',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'CRM Integrado',
      description: 'Gestión completa de clientes y leads',
      color: 'text-orange-600'
    },
    {
      icon: Zap,
      title: 'Respuesta Instantánea',
      description: 'Atiende a tus clientes 24/7 con IA conversacional',
      color: 'text-yellow-600'
    },
    {
      icon: Shield,
      title: 'Seguridad Total',
      description: 'Protección de datos y privacidad garantizada',
      color: 'text-red-600'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfecto para comenzar',
      features: ['1 canal de comunicación', '100 mensajes/mes', 'IA básica', 'Soporte por email'],
      popular: false
    },
    {
      name: 'Professional',
      price: '$29',
      description: 'Para pequeñas empresas',
      features: ['3 canales de comunicación', '1,000 mensajes/mes', 'IA personalizada', 'Analytics avanzados', 'Soporte prioritario'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      description: 'Para empresas en crecimiento',
      features: ['Canales ilimitados', 'Mensajes ilimitados', 'IA avanzada', 'API personalizada', 'Soporte 24/7', 'Consultoría'],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'María González',
      company: 'E-commerce Fashion',
      content: 'Aumentamos nuestras ventas un 40% automatizando la atención al cliente. La IA de ChatBot AI es increíble.',
      rating: 5
    },
    {
      name: 'Carlos Ruiz',
      company: 'Agencia Inmobiliaria',
      content: 'Ahora atendemos leads 24/7. La calificación automática nos ahorra 10 horas semanales.',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      company: 'Restaurante Local',
      content: 'Las reservas automáticas por WhatsApp transformaron nuestro servicio. Recomendado 100%.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ChatBot AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link to="/auth">
                <Button>Comenzar Gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            🚀 7 días gratis + 50% descuento los primeros 3 meses
          </Badge>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Centraliza y automatiza
            <span className="text-blue-600 block">tus conversaciones</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Unifica WhatsApp, Facebook e Instagram en una sola plataforma. 
            Automatiza con IA avanzada y multiplica tu eficiencia operativa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-4">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Ver Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">94.5%</div>
              <div className="text-gray-600">Tasa de respuesta</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">67%</div>
              <div className="text-gray-600">Automatización</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">10x</div>
              <div className="text-gray-600">Más eficiencia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en una plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Potencia tu negocio con herramientas avanzadas de comunicación y automatización
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className={`p-3 w-fit rounded-lg bg-gray-50 mb-4`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-gray-600">
              Empresas que ya transformaron su atención al cliente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes que se adaptan a tu negocio
            </h2>
            <p className="text-xl text-gray-600">
              Comienza gratis y escala según crezcas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-lg transition-shadow duration-300 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Más Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 my-4">
                    {plan.price}
                    <span className="text-lg font-normal text-gray-500">/mes</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button className={`w-full ${plan.popular ? '' : 'variant-outline'}`}>
                      {plan.name === 'Free' ? 'Comenzar Gratis' : 'Elegir Plan'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya automatizaron su atención al cliente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
              Hablar con Ventas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">ChatBot AI</span>
              </div>
              <p className="text-gray-400 mb-4">
                La plataforma de mensajería inteligente que centraliza y automatiza 
                todas tus conversaciones con clientes.
              </p>
              <div className="text-sm text-gray-400">
                © 2024 ChatBot AI. Todos los derechos reservados.
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Características</li>
                <li>Precios</li>
                <li>API</li>
                <li>Integraciones</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Centro de Ayuda</li>
                <li>Documentación</li>
                <li>Contacto</li>
                <li>Estado del Servicio</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
