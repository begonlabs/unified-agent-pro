
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'MENSAJERÍA UNIFICADA',
      description: 'Centraliza WhatsApp, Facebook e Instagram en una sola plataforma',
      color: 'text-blue-600'
    },
    {
      icon: Bot,
      title: 'IA PERSONALIZADA',
      description: 'Automatización inteligente que aprende de tu negocio',
      color: 'text-emerald-600'
    },
    {
      icon: BarChart3,
      title: 'ANALYTICS AVANZADOS',
      description: 'Métricas en tiempo real para optimizar tu operación',
      color: 'text-violet-600'
    },
    {
      icon: Users,
      title: 'CRM INTEGRADO',
      description: 'Gestión completa de clientes y leads',
      color: 'text-orange-600'
    },
    {
      icon: Zap,
      title: 'RESPUESTA INSTANTÁNEA',
      description: 'Atiende a tus clientes 24/7 con IA conversacional',
      color: 'text-yellow-600'
    },
    {
      icon: Shield,
      title: 'SEGURIDAD TOTAL',
      description: 'Protección de datos y privacidad garantizada',
      color: 'text-red-600'
    }
  ];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-zinc-900 mb-6">
            TODO LO QUE NECESITAS
          </h2>
          <p className="text-lg font-mono text-zinc-600 max-w-3xl mx-auto tracking-wide">
            Potencia tu negocio con herramientas avanzadas de comunicación y automatización
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 border-zinc-200 hover:border-zinc-300 bg-white hover:-translate-y-2"
              >
                <CardHeader className="pb-4">
                  <div className={`p-4 w-fit rounded-sm bg-zinc-50 mb-6 group-hover:bg-zinc-100 transition-colors duration-300`}>
                    <Icon className={`h-8 w-8 ${feature.color} transition-transform duration-300 group-hover:scale-110`} />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-wider text-zinc-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-zinc-600 leading-relaxed tracking-wide">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
