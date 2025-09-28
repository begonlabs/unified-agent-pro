# 🎧 Support Module - Módulo de Soporte

Este módulo contiene toda la funcionalidad relacionada con el sistema de soporte al cliente, incluyendo la creación de tickets, gestión de mensajes, y comunicación en tiempo real entre usuarios y administradores.

## 🏗️ Estructura del Módulo

```
support/
├── types/           # Definiciones de tipos TypeScript
│   └── index.ts
├── hooks/           # Hooks personalizados
│   ├── useSupportTickets.ts
│   ├── useSupportMessages.ts
│   ├── useSupportForm.ts
│   ├── useSupportChat.ts
│   └── index.ts
├── services/        # Lógica de negocio y servicios
│   ├── supportService.ts
│   └── index.ts
├── components/      # Componentes UI modulares
│   ├── MessageBubble.tsx
│   ├── TicketCard.tsx
│   ├── TicketForm.tsx
│   ├── TicketList.tsx
│   ├── ChatView.tsx
│   ├── SupportHeader.tsx
│   └── index.ts
├── SupportView.tsx  # Componente principal
├── index.ts         # Exportaciones del módulo
└── README.md        # Esta documentación
```

## 🎯 Componentes Principales

### SupportView
Componente principal que orquesta toda la funcionalidad de soporte.

**Props:**
- `user?: User | null` - Usuario autenticado (opcional, usa useAuth si no se proporciona)

**Características:**
- Manejo automático de autenticación
- Navegación entre vista principal y chat
- Gestión de estado de tickets y mensajes
- Integración con sistema de refresh de datos

### TicketForm
Formulario para crear nuevos tickets de soporte.

**Props:**
- `formData: SupportFormData` - Datos del formulario
- `loading: boolean` - Estado de carga
- `onSubmit: (e: React.FormEvent) => void` - Handler de envío
- `onFormChange: (formData: SupportFormData) => void` - Handler de cambios

**Características:**
- Validación de campos
- Selector de prioridad
- Límites de caracteres
- Estados de carga

### TicketList
Lista de tickets del usuario con estado y contadores.

**Props:**
- `tickets: SupportTicket[]` - Lista de tickets
- `loading: boolean` - Estado de carga
- `onTicketSelect: (ticket: SupportTicket) => void` - Handler de selección
- `getPriorityColor: (priority: string) => string` - Función de colores
- `getStatusColor: (status: string) => string` - Función de colores
- `formatDate: (dateString: string) => string` - Función de formato

**Características:**
- Estados visuales por prioridad y estado
- Contadores de mensajes no leídos
- Información de última actividad
- Estados de carga y vacío

### ChatView
Vista de chat para conversación en tiempo real.

**Props:**
- `ticket: SupportTicket` - Ticket seleccionado
- `messages: SupportMessage[]` - Lista de mensajes
- `newMessage: string` - Mensaje en escritura
- `loadingMessages: boolean` - Estado de carga de mensajes
- `sendingMessage: boolean` - Estado de envío
- `onBack: () => void` - Handler de regreso
- `onMessageChange: (message: string) => void` - Handler de cambio de mensaje
- `onSendMessage: () => void` - Handler de envío
- Funciones de utilidad para colores y formato

**Características:**
- Interfaz de chat moderna
- Diferenciación visual por tipo de mensaje
- Envío con Enter
- Estados de carga
- Información del ticket en header

### MessageBubble
Componente individual para mostrar mensajes.

**Props:**
- `message: SupportMessage` - Datos del mensaje
- `formatDate: (dateString: string) => string` - Función de formato

**Características:**
- Diseño diferenciado por tipo de usuario
- Avatares contextuales
- Timestamps formateados
- Responsive design

## 🔧 Hooks Personalizados

### useSupportTickets
Hook para manejar la lista de tickets del usuario.

**Retorna:**
- `tickets: SupportTicket[]` - Lista de tickets
- `setTickets: (tickets: SupportTicket[]) => void` - Setter de tickets
- `loading: boolean` - Estado de carga
- `fetchTickets: () => Promise<void>` - Función para recargar

**Características:**
- Carga automática al montar
- Integración con refresh de datos
- Manejo de errores con toast
- Estado de carga optimizado

### useSupportMessages
Hook para manejar mensajes de un ticket específico.

**Retorna:**
- `messages: SupportMessage[]` - Lista de mensajes
- `setMessages: (messages: SupportMessage[]) => void` - Setter de mensajes
- `loading: boolean` - Estado de carga
- `fetchMessages: (ticketId: string) => Promise<void>` - Función para cargar mensajes

**Características:**
- Carga bajo demanda
- Manejo de errores
- Estado de carga independiente

### useSupportForm
Hook para manejar el formulario de creación de tickets.

**Retorna:**
- `formData: SupportFormData` - Datos del formulario
- `loading: boolean` - Estado de envío
- `updateFormData: (formData: SupportFormData) => void` - Actualizar datos
- `resetForm: () => void` - Resetear formulario
- `submitTicket: () => Promise<void>` - Enviar ticket

**Características:**
- Validación de datos
- Reset automático tras envío exitoso
- Manejo de errores
- Estados de carga

### useSupportChat
Hook para manejar la funcionalidad de chat.

**Retorna:**
- `newMessage: string` - Mensaje en escritura
- `sendingMessage: boolean` - Estado de envío
- `updateMessage: (message: string) => void` - Actualizar mensaje
- `sendMessage: (ticketId: string, onSuccess?: () => void) => Promise<void>` - Enviar mensaje

**Características:**
- Envío con callback de éxito
- Manejo de errores
- Estados de carga
- Limpieza automática tras envío

## 🛠️ Servicios

### SupportService
Servicio que maneja toda la lógica de negocio para soporte.

**Métodos principales:**
- `fetchTickets(userId: string)` - Obtener tickets del usuario
- `fetchMessages(ticketId: string)` - Obtener mensajes de un ticket
- `createTicket(formData: SupportFormData, user: User)` - Crear nuevo ticket
- `sendMessage(ticketId: string, message: string, user: User)` - Enviar mensaje

**Métodos de utilidad:**
- `getPriorityColor(priority: string)` - Obtener clase CSS de prioridad
- `getStatusColor(status: string)` - Obtener clase CSS de estado
- `formatDate(dateString: string)` - Formatear fecha
- `getPriorityDisplayName(priority: string)` - Nombre de prioridad
- `getStatusDisplayName(status: string)` - Nombre de estado
- `validateFormData(formData: SupportFormData)` - Validar datos del formulario

**Características:**
- Consultas optimizadas a Supabase
- Uso de funciones RPC para contadores
- Manejo de errores robusto
- Validación de datos
- Utilidades de formato y colores

## 📊 Tipos de Datos

### SupportTicket
```typescript
interface SupportTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
  unread_count: number;
}
```

### SupportMessage
```typescript
interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  message_type: 'user' | 'admin' | 'system';
  is_read: boolean;
  created_at: string;
}
```

### SupportFormData
```typescript
interface SupportFormData {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}
```

### PriorityLevel & StatusLevel
```typescript
type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
type StatusLevel = 'open' | 'in_progress' | 'waiting_response' | 'closed';
```

## 🚀 Uso del Módulo

### Importación básica
```typescript
import { SupportView } from '@/components/dashboard/support';
```

### Uso con props personalizadas
```typescript
import { SupportView } from '@/components/dashboard/support';

<SupportView user={currentUser} />
```

### Uso de componentes individuales
```typescript
import { TicketForm, TicketList } from '@/components/dashboard/support';

const MySupportPage = () => {
  const [tickets, setTickets] = useState([]);
  
  return (
    <div>
      <TicketForm {...formProps} />
      <TicketList {...listProps} />
    </div>
  );
};
```

### Uso de hooks
```typescript
import { useSupportTickets, useSupportForm } from '@/components/dashboard/support';

const MyComponent = () => {
  const { tickets, loading } = useSupportTickets(user);
  const { formData, submitTicket } = useSupportForm(user);
  
  // Usar datos de soporte...
};
```

### Uso del servicio
```typescript
import { SupportService } from '@/components/dashboard/support';

const createTicket = async () => {
  try {
    const result = await SupportService.createTicket(formData, user);
    console.log('Ticket creado:', result.ticket.id);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🔄 Integración con el Sistema

### Refresh de Datos
El módulo se integra automáticamente con el sistema de refresh de datos:
- Escucha eventos de refresh para 'support'
- Recarga tickets automáticamente cuando se detectan cambios
- Mantiene sincronización con otros módulos

### Autenticación
- Usa `useAuth` para obtener el usuario autenticado
- Maneja estados de carga y error de autenticación
- Soporta usuario pasado como prop para casos especiales

### Toast Notifications
- Muestra notificaciones de éxito y error
- Proporciona feedback visual durante operaciones
- Mensajes contextuales según la operación

### Base de Datos
- Utiliza funciones RPC de Supabase para contadores optimizados
- Maneja relaciones entre tickets y mensajes
- Soporte para diferentes tipos de mensajes (user, admin, system)

## 🎨 Personalización

### Colores de Prioridad
Los colores de prioridad se pueden personalizar en `SupportService.getPriorityColor()`:
- Urgente: `bg-red-100 text-red-800 border-red-300`
- Alta: `bg-orange-100 text-orange-800 border-orange-300`
- Normal: `bg-blue-100 text-blue-800 border-blue-300`
- Baja: `bg-gray-100 text-gray-800 border-gray-300`

### Colores de Estado
Los colores de estado se pueden personalizar en `SupportService.getStatusColor()`:
- Abierto: `bg-green-100 text-green-800 border-green-300`
- En Progreso: `bg-blue-100 text-blue-800 border-blue-300`
- Esperando Respuesta: `bg-yellow-100 text-yellow-800 border-yellow-300`
- Cerrado: `bg-gray-100 text-gray-800 border-gray-300`

### Validación de Formulario
Los límites de validación se pueden ajustar en `SupportService.validateFormData()`:
- Asunto: máximo 200 caracteres
- Mensaje: máximo 2000 caracteres
- Campos requeridos: asunto y mensaje

## 🧪 Testing

### Componentes Testeables
- `MessageBubble` - Componente puro, fácil de testear
- `TicketCard` - Componente con props bien definidas
- `SupportService` - Lógica de negocio aislada
- Hooks - Con dependencias inyectables

### Datos Mock
Para testing, se pueden usar datos mock:
```typescript
const mockTicket: SupportTicket = {
  id: '1',
  subject: 'Problema con la aplicación',
  priority: 'high',
  status: 'open',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  message_count: 3,
  last_message_at: '2024-01-01T00:00:00Z',
  unread_count: 1
};
```

## 🔧 Mantenimiento

### Agregar Nuevos Tipos de Mensaje
1. Actualizar `MessageType` en types
2. Modificar `MessageBubble` para manejar el nuevo tipo
3. Actualizar `SupportService` si es necesario
4. Actualizar documentación

### Agregar Nuevos Estados de Ticket
1. Actualizar `StatusLevel` en types
2. Agregar color en `SupportService.getStatusColor()`
3. Agregar nombre en `SupportService.getStatusDisplayName()`
4. Actualizar documentación

### Agregar Nuevas Prioridades
1. Actualizar `PriorityLevel` en types
2. Agregar color en `SupportService.getPriorityColor()`
3. Agregar nombre en `SupportService.getPriorityDisplayName()`
4. Actualizar `TicketForm` para incluir la nueva opción

## 📈 Performance

### Optimizaciones Implementadas
- Consultas SQL optimizadas con funciones RPC
- Carga bajo demanda de mensajes
- Estados de carga independientes
- Memoización de funciones de utilidad
- Debounce en envío de mensajes

### Consideraciones
- Los mensajes se cargan solo cuando se selecciona un ticket
- Los tickets se refrescan automáticamente tras crear/enviar
- El estado se actualiza de forma eficiente para evitar re-renders innecesarios
- Las funciones de utilidad están memoizadas

## 🐛 Troubleshooting

### Problemas Comunes

**Tickets no se cargan:**
- Verificar que el usuario esté autenticado
- Revisar permisos de la base de datos
- Comprobar que la función RPC `get_user_tickets_with_message_count` exista
- Revisar logs de la consola para errores

**Mensajes no se envían:**
- Verificar que el ticket esté seleccionado
- Comprobar que el mensaje no esté vacío
- Revisar permisos de escritura en `support_messages`
- Verificar que el usuario tenga permisos

**Formulario no se envía:**
- Verificar validación de campos
- Comprobar límites de caracteres
- Revisar que todos los campos requeridos estén llenos
- Verificar permisos de creación de tickets

**Estados visuales incorrectos:**
- Verificar que los colores estén definidos en `SupportService`
- Comprobar que los tipos de prioridad/estado coincidan
- Revisar las clases CSS de Tailwind

---

Este módulo proporciona una base sólida y escalable para todas las funcionalidades de soporte al cliente, manteniendo el código organizado, testeable y fácil de mantener. La arquitectura modular permite una fácil extensión y personalización según las necesidades específicas del proyecto.
