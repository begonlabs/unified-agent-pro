import React from 'react';
import { Link } from 'react-router-dom';

// Legal: Privacy Policy page for Meta App Review and users
const Privacy = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold">Política de Privacidad</h1>
          <p className="text-white/80 mt-2">Última actualización: 2025-08-11</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Quiénes somos</h2>
          <p className="text-gray-600 leading-relaxed">
            OndAI es una plataforma para centralizar y automatizar conversaciones con IA.
            Esta política explica cómo recopilamos, usamos y protegemos tu información.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Datos que recopilamos</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Datos de cuenta: nombre, email y metadatos de perfil.</li>
            <li>Datos de uso: actividad en la plataforma y métricas técnicas.</li>
            <li>Datos de mensajería: contenidos y metadatos enviados/recibidos desde canales conectados (p. ej., Facebook, Instagram, WhatsApp).</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Cómo usamos los datos</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Autenticación, provisión del servicio y mejora del producto.</li>
            <li>Integraciones con Meta (Facebook/Instagram) para enviar/recibir mensajes en tu nombre, con tu consentimiento.</li>
            <li>Análisis agregados y seguridad.</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Base legal y consentimiento</h2>
          <p className="text-gray-600">Procesamos datos para ejecutar el contrato de servicio y sobre intereses legítimos. Puedes revocar accesos desde la configuración de canales.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Terceros</h2>
          <p className="text-gray-600">Usamos proveedores como Supabase y las APIs de Meta. Estos terceros procesan datos conforme a sus políticas y acuerdos.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Retención y seguridad</h2>
          <p className="text-gray-600">Conservamos los datos el tiempo necesario para prestar el servicio o cumplir con obligaciones legales. Aplicamos controles de acceso, cifrado en tránsito y buenas prácticas de seguridad.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Tus derechos</h2>
          <p className="text-gray-600">Puedes solicitar acceso, rectificación o eliminación de tus datos. Para ejercerlos, contáctanos.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Contacto</h2>
          <p className="text-gray-600">Email: contacto@ondai.app</p>
        </section>

        <div className="text-center">
          <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </main>
  );
};

export default Privacy;

