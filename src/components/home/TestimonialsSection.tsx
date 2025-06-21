
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'MARÍA GONZÁLEZ',
      company: 'E-COMMERCE FASHION',
      content: 'Aumentamos nuestras ventas un 40% automatizando la atención al cliente. La IA de ChatBot AI es increíble.',
      rating: 5
    },
    {
      name: 'CARLOS RUIZ',
      company: 'AGENCIA INMOBILIARIA',
      content: 'Ahora atendemos leads 24/7. La calificación automática nos ahorra 10 horas semanales.',
      rating: 5
    },
    {
      name: 'ANA MARTÍNEZ',
      company: 'RESTAURANTE LOCAL',
      content: 'Las reservas automáticas por WhatsApp transformaron nuestro servicio. Recomendado 100%.',
      rating: 5
    }
  ];

  return (
    <section className="py-32 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-zinc-900 mb-6">
            LO QUE DICEN NUESTROS CLIENTES
          </h2>
          <p className="text-lg font-mono text-zinc-600 tracking-wide">
            Empresas que ya transformaron su atención al cliente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 border-zinc-200 hover:border-zinc-300 bg-white hover:-translate-y-2"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-wider text-zinc-900">
                  {testimonial.name}
                </CardTitle>
                <CardDescription className="text-sm font-mono tracking-wider text-zinc-500 uppercase">
                  {testimonial.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-zinc-600 italic leading-relaxed tracking-wide">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
