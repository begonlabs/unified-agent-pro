import React, { useState } from 'react';
import { Mail, MessageSquare, ShieldCheck, Trash2, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import logoWhite from '@/assets/logo_white.png';

const ContactSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const openMail = (subject: string) => {
    const mailto = `mailto:soporte@ondai.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`
    )}`;
    window.location.href = mailto;
  };

  return (
    <section id="contacto" className="relative py-24 bg-zinc-950">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-blue-600/5 to-purple-600/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-8 w-8 rounded-lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Contacto</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Quick cards */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#3a0caa]/20 border border-[#3a0caa]/30">
                  <MessageSquare className="h-5 w-5 text-[#3a0caa]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Soporte general</h3>
                  <p className="text-zinc-400 text-sm">Preguntas, bugs o ayuda con la plataforma.</p>
                  <a href="mailto:soporte@ondai.app" className="text-[#3a0caa] text-sm hover:underline">soporte@ondai.app</a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#710db2]/20 border border-[#710db2]/30">
                  <HelpCircle className="h-5 w-5 text-[#710db2]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Consultas y demos</h3>
                  <p className="text-zinc-400 text-sm">Conversemos sobre tu caso de uso y pricing.</p>
                  <a href="mailto:contacto@ondai.app" className="text-[#710db2] text-sm hover:underline">contacto@ondai.app</a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-red-600/20 border border-red-600/30">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Eliminación de datos</h3>
                  <p className="text-zinc-400 text-sm">Solicita borrar tu cuenta y datos asociados.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <a href="/data-deletion" className="text-red-400 text-sm hover:underline">Leer proceso</a>
                    <a href="mailto:privacy@ondai.app?subject=Solicitud%20de%20Eliminaci%C3%B3n%20de%20Datos" className="text-red-400 text-sm hover:underline">Enviar solicitud</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Simple form (mailto) */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" /> Envíanos un mensaje
            </h3>
            <div className="space-y-4">
              <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Textarea rows={6} placeholder="Cuéntanos en qué podemos ayudarte" value={message} onChange={(e) => setMessage(e.target.value)} />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => openMail('Soporte OndAI')} className="bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white">Enviar a Soporte</Button>
                <Button onClick={() => openMail('Consulta Comercial OndAI')} variant="outline" className="border-[#3a0caa] text-[#3a0caa] hover:bg-[#3a0caa] hover:text-white">Consulta Comercial</Button>
                <Button onClick={() => openMail('Eliminación de datos - OndAI')} className="bg-red-600 hover:bg-red-500">Solicitud de Eliminación</Button>
              </div>
              <p className="text-xs text-zinc-500">Al enviar, se abrirá tu cliente de correo con el mensaje prellenado.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

