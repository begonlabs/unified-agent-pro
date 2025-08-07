
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'MENSAJERÍA UNIFICADA',
      description: 'Centraliza WhatsApp, Facebook e Instagram en una sola plataforma',
      color: 'text-blue-400'
    },
    {
      icon: Bot,
      title: 'IA PERSONALIZADA',
      description: 'Automatización inteligente que aprende de tu negocio',
      color: 'text-emerald-400'
    },
    {
      icon: BarChart3,
      title: 'ANALYTICS AVANZADOS',
      description: 'Métricas en tiempo real para optimizar tu operación',
      color: 'text-violet-400'
    },
    {
      icon: Users,
      title: 'CRM INTEGRADO',
      description: 'Gestión completa de clientes y leads',
      color: 'text-orange-400'
    },
    {
      icon: Zap,
      title: 'RESPUESTA INSTANTÁNEA',
      description: 'Atiende a tus clientes 24/7 con IA conversacional',
      color: 'text-yellow-400'
    },
    {
      icon: Shield,
      title: 'SEGURIDAD TOTAL',
      description: 'Protección de datos y privacidad garantizada',
      color: 'text-red-400'
    }
  ];

  return (
    <section className="py-32 bg-zinc-900 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-white mb-6 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:bg-clip-text transition-all duration-700 cursor-default">
            TODO LO QUE NECESITAS
          </h2>
          <p className="text-lg font-mono text-zinc-400 max-w-3xl mx-auto tracking-wide hover:text-zinc-300 transition-colors duration-300">
            Potencia tu negocio con herramientas avanzadas de comunicación e IA automatizada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-zinc-700 hover:border-blue-500/50 bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-800/80 hover:-translate-y-4 transform"
              >
                <CardHeader className="pb-4">
                  <div className={`p-4 w-fit rounded-sm bg-zinc-700/50 mb-6 group-hover:bg-zinc-600/50 transition-all duration-300 group-hover:shadow-lg`}>
                    <Icon className={`h-8 w-8 ${feature.color} transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg`} />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-wider text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-zinc-300 leading-relaxed tracking-wide group-hover:text-white transition-colors duration-300">
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
