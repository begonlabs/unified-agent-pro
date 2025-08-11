import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

// Public page describing user data deletion process (required by Meta)
const DataDeletion = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Trash2 className="h-7 w-7" /> Proceso de Eliminación de Datos</h1>
          <p className="text-white/80 mt-2">Cumpliendo con políticas de Meta y privacidad de usuarios</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Cómo solicitar la eliminación</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Envía un correo a <a className="text-red-600 hover:underline" href="mailto:privacy@ondai.app?subject=Solicitud%20de%20Eliminaci%C3%B3n%20de%20Datos">privacy@ondai.app</a> desde el email asociado a tu cuenta.</li>
            <li>Incluye: nombre de la empresa, email de la cuenta y motivo (opcional).</li>
            <li>Procesaremos la solicitud en un máximo de 30 días laborables.</li>
          </ol>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Qué datos se eliminan</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Perfil y credenciales de acceso.</li>
            <li>Canales conectados y tokens almacenados.</li>
            <li>Conversaciones, mensajes y clientes CRM asociados.</li>
          </ul>
          <p className="text-gray-600 mt-2">Podrían conservarse ciertos registros mínimos si la ley lo requiere (p. ej., facturación).</p>
        </section>

        <div className="text-center">
          <Link to="/" className="text-blue-600 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </main>
  );
};

export default DataDeletion;

