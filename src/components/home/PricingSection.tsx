
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  const plans = [
    {
      name: 'FREE',
      price: '$0',
      description: 'Perfecto para comenzar',
      features: ['1 canal de comunicación', '100 mensajes/mes', 'IA básica', 'Soporte por email'],
      popular: false
    },
    {
      name: 'PROFESSIONAL',
      price: '$29',
      description: 'Para pequeñas empresas',
      features: ['3 canales de comunicación', '1,000 mensajes/mes', 'IA personalizada', 'Analytics avanzados', 'Soporte prioritario'],
      popular: true
    },
    {
      name: 'ENTERPRISE',
      price: '$99',
      description: 'Para empresas en crecimiento',
      features: ['Canales ilimitados', 'Mensajes ilimitados', 'IA avanzada', 'API personalizada', 'Soporte 24/7', 'Consultoría'],
      popular: false
    }
  ];

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-zinc-900 mb-6">
            PLANES QUE SE ADAPTAN
          </h2>
          <p className="text-lg font-mono text-zinc-600 tracking-wide">
            Comienza gratis con OndAI y escala según tu negocio crezca
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative group hover:shadow-2xl transition-all duration-500 border-zinc-200 hover:border-zinc-300 bg-white hover:-translate-y-2 ${
                plan.popular ? 'ring-2 ring-zinc-900 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white font-mono tracking-wider uppercase">
                  MÁS POPULAR
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-black uppercase tracking-widest text-zinc-900">
                  {plan.name}
                </CardTitle>
                <div className="text-5xl font-black text-zinc-900 my-6">
                  {plan.price}
                  <span className="text-lg font-mono font-normal text-zinc-500">/mes</span>
                </div>
                <CardDescription className="text-sm font-mono tracking-wider text-zinc-500 uppercase">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-mono text-zinc-600 tracking-wide">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <button className={`w-full px-6 py-3 text-sm font-mono tracking-wider uppercase transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-zinc-900 text-white hover:bg-zinc-700' 
                      : 'border-2 border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                  }`}>
                    {plan.name === 'FREE' ? 'COMENZAR GRATIS' : 'ELEGIR PLAN'}
                  </button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
