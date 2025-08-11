import React from 'react';
import { Link } from 'react-router-dom';

// Legal: Terms of Service page for Meta App Review and users
const Terms = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
          <p className="text-white/80 mt-2">Última actualización: 2025-08-11</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Aceptación</h2>
          <p className="text-gray-600">Al usar OndAI aceptas estos términos y la Política de Privacidad.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Servicio</h2>
          <p className="text-gray-600">Proveemos herramientas para gestionar conversaciones mediante integraciones con terceros como Meta. No garantizamos disponibilidad continua y podemos actualizar el servicio.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Cuentas y seguridad</h2>
          <p className="text-gray-600">Eres responsable de mantener la confidencialidad de tus credenciales y accesos a canales conectados.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Contenido</h2>
          <p className="text-gray-600">Eres titular del contenido enviado a través de la plataforma y garantizas que tienes derecho a usarlo. Nos concedes una licencia limitada para operar el servicio.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Uso aceptable</h2>
          <p className="text-gray-600">No uses el servicio para spam, fraude, actividades ilegales o para infringir derechos de terceros.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Limitación de responsabilidad</h2>
          <p className="text-gray-600">El servicio se ofrece "tal cual". Nuestra responsabilidad se limita a los importes pagados en los últimos 12 meses.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Rescisión</h2>
          <p className="text-gray-600">Podemos suspender o terminar cuentas que violen estos términos. Puedes cancelar en cualquier momento.</p>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Contacto</h2>
          <p className="text-gray-600">Email: legal@ondai.app</p>
        </section>

        <div className="text-center">
          <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </main>
  );
};

export default Terms;

