
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
    <section className="py-32 bg-zinc-900 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-widest text-white mb-6 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:bg-clip-text transition-all duration-700 cursor-default">
            LO QUE DICEN NUESTROS CLIENTES
          </h2>
          <p className="text-lg font-mono text-zinc-400 tracking-wide hover:text-zinc-300 transition-colors duration-300">
            Empresas que ya transformaron su atención al cliente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border-zinc-700 hover:border-blue-500/50 bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-800/80 hover:-translate-y-4 transform"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" style={{transitionDelay: `${i * 50}ms`}} />
                  ))}
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors duration-300">
                  {testimonial.name}
                </CardTitle>
                <CardDescription className="text-sm font-mono tracking-wider text-zinc-400 uppercase group-hover:text-zinc-300 transition-colors duration-300">
                  {testimonial.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-zinc-300 italic leading-relaxed tracking-wide group-hover:text-white transition-colors duration-300">
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
