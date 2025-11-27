# 🤖 OndAI - Plataforma Unificada de Atención al Cliente con IA

<div align="center">

![OndAI Logo](https://img.shields.io/badge/OndAI-Powered%20by%20AI-blue?style=for-the-badge&logo=openai)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**Gestiona todas tus conversaciones de WhatsApp, Facebook e Instagram desde una sola plataforma con IA integrada**

[Demo en Vivo](https://app.ondai.ai) · [Reportar un Bug](https://github.com/begonlabs/unified-agent-pro/issues) · [Solicitar Función](https://github.com/begonlabs/unified-agent-pro/issues)

</div>

---

## ✨ Características Principales

### 🌐 **Multicanal Unificado**
- ✅ **WhatsApp Business** - Integración completa vía Green API
- ✅ **Facebook Messenger** - Gestión nativa de mensajes
- ✅ **Instagram Direct** - Soporte completo de DMs

### 🤖 **Asistente de IA Inteligente**
- 🧠 Respuestas automáticas personalizadas con OpenAI GPT-4
- ⚙️ Configuración de objetivos y restricciones
- 📚 Base de conocimiento personalizable
- ❓ Sistema de preguntas frecuentes (FAQ)
- ⏰ Horarios de operación configurables
- 👤 Derivación inteligente a agente humano

### 💼 **CRM Integrado**
- 📊 Vista consolidada de todos los clientes
- 🔍 Filtros avanzados por canal, estado y fecha
- 👥 Perfiles completos con foto y nombre extraídos automáticamente
- 📈 Estadísticas de interacción en tiempo real
- 🏷️ Sistema de etiquetas y estados personalizables

### 💬 **Gestión de Conversaciones**
- 🔴 Indicadores de mensajes no leídos
- ⚡ Actualizaciones en tiempo real
- 🔔 Sistema de notificaciones inteligente
- ✉️ Notificaciones por email para eventos críticos
- 🎯 Modo de respuesta manual o automática

### 📊 **Panel de Estadísticas**
- 📈 Métricas de rendimiento en tiempo real
- 📉 Análisis de patrones de interacción
- 🎯 Tasa de respuesta de la IA
- ⏱️ Tiempos promedio de respuesta

---

## 🚀 Tecnologías

### Frontend
- **React 19** con TypeScript
- **Vite** para desarrollo ultrarrápido
- **TailwindCSS** para estilos modernos
- **shadcn/ui** para componentes reutilizables
- **Zustand** para gestión de estado global

### Backend
- **Supabase** (PostgreSQL + Edge Functions)
- **Deno** para Edge Functions serverless
- **OpenAI API** para procesamiento de lenguaje natural
- **Meta Graph API** para Facebook e Instagram
- **Green API** para WhatsApp Business

### Características Técnicas
- ⚡ Actualizaciones en tiempo real con PostgreSQL Realtime
- 🔐 Autenticación segura con Supabase Auth
- 🌍 Edge Functions para respuestas ultrarrápidas
- 📱 Diseño responsive y mobile-first
- 🎨 Dark mode nativo

---

## 📦 Instalación y Configuración

### Prerrequisitos

```bash
node >= 18.0.0
npm >= 9.0.0
```

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/begonlabs/unified-agent-pro.git
cd unified-agent-pro
```

### 2️⃣ Instalar Dependencias

```bash
npm install
```

### 3️⃣ Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Meta (Facebook/Instagram)
META_APP_ID=tu_meta_app_id
META_APP_SECRET=tu_meta_app_secret
META_GRAPH_VERSION=v24.0
META_VERIFY_TOKEN=tu_verify_token
META_REDIRECT_URI=https://tu-dominio.com/functions/v1/meta-oauth

# Green API (WhatsApp)
GREEN_API_INSTANCE_ID=tu_instance_id
GREEN_API_TOKEN=tu_api_token

# OpenAI
OPENAI_API_KEY=tu_openai_api_key

# Email (Resend)
RESEND_API_KEY=tu_resend_api_key
```

### 4️⃣ Ejecutar Migraciones de Base de Datos

```bash
cd supabase
npx supabase db push
```

### 5️⃣ Desplegar Edge Functions

```bash
./deploy-green-api.sh
```

### 6️⃣ Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🎯 Uso Rápido

### Conectar Canales

1. **WhatsApp Business**
   - Ve a Dashboard → Canales
   - Haz clic en "Conectar WhatsApp"
   - Ingresa tu Instance ID y API Token de Green API
   - Confirma la conexión

2. **Facebook Messenger**
   - Ve a Dashboard → Canales
   - Haz clic en "Conectar con Facebook"
   - Autoriza los permisos solicitados
   - Selecciona la página a conectar

3. **Instagram**
   - Ve a Dashboard → Canales
   - Haz clic en "Conectar con Instagram"
   - Autoriza los permisos solicitados
   - Selecciona la cuenta business a conectar

### Configurar tu Agente de IA

1. Ve a **Mi Agente IA**
2. Define tus **Objetivos** (qué debe lograr el asistente)
3. Establece **Restricciones** (qué no debe hacer)
4. Agrega tu **Base de Conocimiento** (información del negocio)
5. Crea **Preguntas Frecuentes** (respuestas predefinidas)
6. Configura **Horarios** de operación
7. Activa la **Derivación a Humano** si es necesario
8. Haz clic en **Guardar Configuración**

### Gestionar Conversaciones

- Las conversaciones nuevas aparecen automáticamente en **Mensajes**
- Los mensajes no leídos se marcan con un indicador rojo
- Puedes **responder manualmente** o dejar que la **IA responda**
- Cambia el **estado** de la conversación (Abierta, En Proceso, Cerrada)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│   React App     │  ← Frontend (Vite + React)
└────────┬────────┘
         │
    ┌────▼────┐
    │Supabase │
    │  Auth   │  ← Autenticación
    └────┬────┘
         │
┌────────▼────────────────────┐
│   PostgreSQL Database       │  ← Base de datos principal
│  - users                    │
│  - communication_channels   │
│  - crm_clients              │
│  - conversations            │
│  - messages                 │
│  - ai_configurations        │
│  - notifications            │
└───────────┬─────────────────┘
            │
     ┌──────┴──────┐
     │   Realtime  │  ← Actualizaciones en vivo
     └──────┬──────┘
            │
┌───────────▼───────────────┐
│  Supabase Edge Functions  │
│  - meta-webhook           │  ← Webhooks de Facebook/Instagram
│  - meta-oauth             │  ← OAuth de Meta
│  - green-api-webhook      │  ← Webhooks de WhatsApp
│  - send-message           │  ← Envío de mensajes
└───────────┬───────────────┘
            │
     ┌──────┴──────┐
     │  OpenAI API │  ← Procesamiento de IA
     └─────────────┘
```

---

## 📚 Documentación Adicional

- [📖 Guía de Configuración Completa](docs/setup.md)
- [🔧 API Reference](docs/api.md)
- [🎨 Guía de Personalización](docs/customization.md)
- [🐛 Solución de Problemas](docs/troubleshooting.md)
- [🔐 Seguridad y Permisos](docs/security.md)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [Guía de Contribución](CONTRIBUTING.md) antes de enviar un Pull Request.

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

Desarrollado con ❤️ por [Begon Labs](https://github.com/begonlabs)

---

## 📞 Soporte

¿Necesitas ayuda? Contáctanos:

- 📧 Email: support@ondai.ai
- 💬 Discord: [Únete a nuestra comunidad](https://discord.gg/ondai)
- 📖 Documentación: [docs.ondai.ai](https://docs.ondai.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/begonlabs/unified-agent-pro/issues)

---

<div align="center">

**⭐ Si te gusta OndAI, ¡danos una estrella en GitHub! ⭐**

Made with 💙 by Begon Labs

</div>
