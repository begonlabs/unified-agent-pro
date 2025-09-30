# Channels Module

Este módulo maneja la configuración y gestión de canales de comunicación (WhatsApp, Facebook, Instagram) de manera modular y escalable.

## Estructura

```
channels/
├── components/           # Componentes UI modulares
│   ├── ChannelCard.tsx   # Card reutilizable para canales
│   ├── ChannelStatus.tsx # Estado general de canales
│   ├── WhatsAppChannel.tsx # Componente específico de WhatsApp
│   ├── FacebookChannel.tsx # Componente específico de Facebook
│   ├── InstagramChannel.tsx # Componente específico de Instagram
│   └── VerificationCodeDisplay.tsx # Display de códigos de verificación
├── hooks/               # Hooks personalizados
│   ├── useChannels.ts  # Gestión de lista de canales
│   ├── useChannelConnections.ts # Conexiones OAuth
│   ├── useInstagramVerification.ts # Verificación de Instagram
│   ├── useChannelActions.ts # Acciones de canales
│   └── useCountdown.ts # Timer de cuenta regresiva
├── services/            # Lógica de negocio
│   └── channelsService.ts # Servicios de Supabase y APIs
├── types/              # Definiciones de tipos
│   └── index.ts        # Interfaces y tipos TypeScript
├── ChannelsView.tsx     # Componente principal
├── index.ts           # Exportaciones del módulo
└── README.md          # Esta documentación
```

## Componentes Principales

### ChannelsView
Componente principal que orquesta todos los módulos de canales. Maneja:
- Estado de autenticación
- Carga inicial de canales
- Detección automática de Instagram
- Manejo de parámetros de URL
- Renderizado de todos los canales

### ChannelCard
Componente reutilizable que proporciona:
- Diseño consistente para todos los canales
- Estado de conexión visual
- Iconos y colores específicos por canal
- Contenido personalizable

### Canales Específicos
- **WhatsAppChannel**: Maneja conexión con WhatsApp Business API
- **FacebookChannel**: Maneja conexión con Facebook Messenger
- **InstagramChannel**: Maneja conexión con Instagram Direct + verificación

## Hooks Personalizados

### useChannels
- Gestiona la lista de canales del usuario
- Maneja carga inicial y refrescos
- Proporciona estado de conexión

### useChannelConnections
- Maneja flujos OAuth para WhatsApp, Facebook e Instagram
- Carga Facebook SDK
- Procesa respuestas de autenticación

### useInstagramVerification
- Genera códigos de verificación
- Maneja polling de estado
- Limpia códigos expirados

### useChannelActions
- Desconexión de canales
- Testing de webhooks
- Manejo de errores

## Servicios

### ChannelsService
Centraliza toda la lógica de negocio:
- Interacciones con Supabase
- Procesamiento de OAuth
- Generación de códigos de verificación
- Validación de estados de conexión
- Manejo de errores

## Tipos TypeScript

Define interfaces para:
- Configuraciones de canales (WhatsApp, Facebook, Instagram)
- Respuestas de Facebook SDK
- Verificaciones de Instagram
- Props de componentes
- Estados de conexión

## Características Principales

### WhatsApp Business (Versión Simple - OAuth Directo)
- OAuth directo con Meta (sin SMS)
- Embedded Signup automático
- Configuración de webhooks
- Manejo de tokens de acceso
- Reconexión automática
- Cloud API v18.0+

### Facebook Messenger
- OAuth con páginas de Facebook
- Suscripción a webhooks
- Testing de webhooks
- Gestión de tokens

### Instagram Direct
- OAuth con cuentas profesionales
- Verificación automática
- Códigos de verificación con expiración
- Polling de estado
- Detección automática de mensajes

## Uso

```tsx
import { ChannelsView } from '@/components/dashboard/channels';

// En tu componente principal
<ChannelsView user={user} />
```

## Beneficios de la Modularización

1. **Mantenibilidad**: Cada canal tiene su propia lógica separada
2. **Escalabilidad**: Fácil agregar nuevos canales
3. **Reutilización**: Componentes y hooks reutilizables
4. **Testing**: Cada módulo se puede testear independientemente
5. **Legibilidad**: Código más organizado y fácil de entender
6. **Separación de responsabilidades**: UI, lógica y datos separados

## Flujo de Trabajo

1. **Carga inicial**: `useChannels` obtiene canales del usuario
2. **Detección**: Se detectan canales que necesitan verificación
3. **Conexión**: Usuario puede conectar nuevos canales via OAuth
4. **Verificación**: Instagram requiere verificación adicional
5. **Monitoreo**: Sistema monitorea estado de conexiones
6. **Acciones**: Usuario puede desconectar o probar canales

## Consideraciones Técnicas

- **Facebook SDK**: Se carga dinámicamente cuando es necesario
- **Polling**: Instagram verification usa polling cada 3 segundos
- **Limpieza**: Códigos expirados se limpian automáticamente
- **Error Handling**: Manejo robusto de errores en todas las operaciones
- **Responsive**: Diseño adaptativo para móviles y desktop
