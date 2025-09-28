# CRM Module

Módulo modularizado para la gestión de clientes del CRM.

## Estructura

```
crm/
├── CRMView.tsx              # Componente principal (orquestador)
├── components/              # Componentes UI modulares
│   ├── ClientStats.tsx      # Estadísticas de clientes
│   ├── ClientFilters.tsx    # Filtros y búsqueda
│   ├── ClientCard.tsx       # Tarjeta individual de cliente
│   └── EditClientDialog.tsx # Modal de edición
├── hooks/                   # Hooks personalizados
│   ├── useClients.ts        # Gestión de clientes
│   ├── useClientFilters.ts  # Filtros y búsqueda
│   ├── useClientActions.ts  # Acciones CRUD
│   ├── useExport.ts         # Exportación CSV/Excel
│   └── useClientForm.ts     # Formulario de edición
├── services/                # Lógica de negocio
│   └── crmService.ts        # Operaciones de base de datos
├── types/                   # Definiciones TypeScript
│   └── index.ts            # Interfaces y tipos
└── index.ts                # Exportaciones del módulo
```

## Componentes

### CRMView
Componente principal que orquesta todos los demás componentes y hooks.

### ClientStats
Muestra estadísticas generales de clientes (total, leads, prospectos, activos).

### ClientFilters
Maneja la búsqueda, filtros por estado/origen y exportación.

### ClientCard
Tarjeta individual que muestra información del cliente con acciones.

### EditClientDialog
Modal para editar información completa del cliente.

## Hooks

### useClients
- Gestión del estado de clientes
- Fetching de datos desde Supabase
- Loading states
- Refresh listener

### useClientFilters
- Estado de filtros (búsqueda, estado, origen)
- Clientes filtrados
- Actualización de filtros

### useClientActions
- Actualización de estado de cliente
- Actualización completa de cliente
- Manejo de errores

### useExport
- Exportación a CSV
- Exportación a Excel
- Generación de archivos

### useClientForm
- Estado del formulario de edición
- Apertura/cierre del modal
- Validación de datos

## Servicios

### CRMService
- Operaciones CRUD con Supabase
- Generación de CSV/Excel
- Utilidades (parseo de teléfonos, colores de estado)
- Filtrado y estadísticas

## Tipos

### Client
Interfaz principal para los datos de cliente.

### ClientFormData
Datos del formulario de edición.

### ClientFilters
Estado de los filtros de búsqueda.

### ClientStats
Estadísticas calculadas de clientes.

## Beneficios de la Modularización

1. **Mantenibilidad**: Código organizado en archivos pequeños y enfocados
2. **Reutilización**: Componentes y hooks reutilizables
3. **Testabilidad**: Cada módulo puede ser probado independientemente
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades
5. **Legibilidad**: Estructura clara y fácil de entender
6. **Separación de responsabilidades**: UI, lógica y datos separados

## Uso

```typescript
import { CRMView } from '@/components/dashboard/crm';

// En tu componente padre
<CRMView user={user} />
```

## Funcionalidades

- ✅ Gestión completa de clientes (CRUD)
- ✅ Búsqueda y filtros avanzados
- ✅ Exportación a CSV y Excel
- ✅ Estadísticas en tiempo real
- ✅ Formulario de edición completo
- ✅ Validación de teléfonos internacionales
- ✅ Estados de cliente personalizables
- ✅ Responsive design
- ✅ Manejo de errores robusto