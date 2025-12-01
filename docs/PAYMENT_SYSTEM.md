# Sistema de Pagos con dLocalGo

Documentación para configurar e implementar el sistema de pagos integrado con dLocalGo.

## 📋 Resumen

Este sistema implementa:
- **Período de prueba gratuito** de 7 días con acceso a Facebook e Instagram (sin WhatsApp)
- **Tres planes de pago**: Básico ($49), Avanzado ($139), Pro ($399)
- **Integración con dLocalGo** para procesamiento de pagos
- **Restricciones de canales** según el plan del usuario

## 🚀 Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# dLocalGo Payment Configuration
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_WEBHOOK_SECRET=tu_webhook_secret
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
PUBLIC_URL=https://tu-dominio.com
```

> **Nota**: Las credenciales mostradas son para el entorno de **sandbox**. Para producción, reemplázalas con tus credenciales reales.

### 2. Migración de Base de Datos

Ejecuta la migración para crear las tablas necesarias:

```bash
# Desde el directorio del proyecto
cd supabase
supabase db push
```

O aplica manualmente la migración:
```bash
psql -h your-db-host -U postgres -d postgres -f migrations/20251201000000_add_payment_system.sql
```

### 3. Desplegar Edge Functions

Despliega las funciones de Supabase:

```bash
# Función para crear pagos
supabase functions deploy create-payment

# Función para recibir webhooks
supabase functions deploy payment-webhook

# Función para verificar suscripciones
supabase functions deploy verify-subscription
```

### 4. Configurar Webhook en dLocalGo

1. Inicia sesión en tu cuenta de dLocalGo
2. Ve a **Settings** → **Webhooks**
3. Agrega la URL de tu webhook:
   ```
   https://tu-proyecto.supabase.co/functions/v1/payment-webhook
   ```
4. Selecciona los eventos:
   - `payment.approved`
   - `payment.rejected`
   - `payment.cancelled`
5. Guarda el **Webhook Secret** y agrégalo a tus variables de entorno

## 📊 Estructura de Planes

### Plan Gratuito (Trial)
- **Duración**: 7 días
- **Canales**: Facebook e Instagram
- **Restricciones**: Sin acceso a WhatsApp
- **Precio**: $0

### Plan Básico
- **Precio**: $49 USD (pago único)
- **WhatsApp**: 1 canal
- **Otros canales**: Facebook e Instagram
- **Mensajes**: 1,000/mes
- **IA**: Básica

### Plan Avanzado
- **Precio**: $139 USD (pago único)
- **WhatsApp**: 3 canales
- **Otros canales**: Facebook e Instagram
- **Mensajes**: 5,000/mes
- **IA**: Avanzada
- **Extras**: Soporte prioritario, análisis detallados

### Plan Pro
- **Precio**: $399 USD (pago único)
- **WhatsApp**: Ilimitado
- **Otros canales**: Facebook e Instagram
- **Mensajes**: Ilimitados
- **IA**: Personalizada
- **Extras**: Soporte 24/7, API completa, integraciones avanzadas

## 🔄 Flujo de Pago

1. **Usuario selecciona plan** en la interfaz
2. **Modal de confirmación** muestra detalles del plan
3. **Click en "Pagar Ahora"** llama a `create-payment` Edge Function
4. **Redirección a dLocalGo** para completar el pago
5. **Usuario completa el pago** en la pasarela de dLocalGo
6. **Webhook recibe notificación** de estado del pago
7. **Plan se activa automáticamente** si el pago fue exitoso
8. **Email de confirmación** se envía al usuario

## 🔐 Permisos de Canales

El sistema controla automáticamente qué canales puede conectar cada usuario:

```typescript
// Ejemplo de uso
import { getChannelPermissions, canConnectChannel } from '@/lib/channelPermissions';

const permissions = getChannelPermissions(profile);
console.log(permissions);
// {
//   whatsapp: true,
//   facebook: true,
//   instagram: true,
//   maxWhatsappChannels: 1,
//   maxChannels: 3
// }

const result = canConnectChannel(profile, 'whatsapp', currentCount);
if (!result.allowed) {
  toast.error(result.reason);
}
```

## 🧪 Testing

### Probar en Sandbox

1. **Crear usuario nuevo**:
   - Registra un nuevo usuario
   - Verifica que tiene 7 días de trial
   - Confirma acceso a FB e IG, pero no WhatsApp

2. **Simular pago**:
   - Selecciona un plan
   - Completa el pago en sandbox de dLocalGo
   - Usa tarjetas de prueba proporcionadas por dLocalGo

3. **Verificar activación**:
   - Confirma que el plan se actualizó
   - Verifica acceso a WhatsApp
   - Revisa que se creó el registro en `payments`

### Tarjetas de Prueba (dLocalGo Sandbox)

Consulta la documentación de dLocalGo para tarjetas de prueba específicas de cada país.

## 📝 Tablas de Base de Datos

### `profiles`
Campos agregados:
- `trial_start_date`: Inicio del trial
- `trial_end_date`: Fin del trial (7 días después)
- `is_trial`: Boolean indicando si está en trial
- `payment_status`: Estado del pago ('trial', 'pending', 'active', 'expired', 'cancelled')

### `payments`
Registra todas las transacciones:
- `id`: UUID
- `user_id`: Usuario que realizó el pago
- `plan_type`: Plan adquirido
- `amount`: Monto pagado
- `dlocalgo_payment_id`: ID de transacción en dLocalGo
- `status`: Estado del pago
- `payment_data`: Datos completos del pago (JSONB)

### `subscriptions`
Gestiona suscripciones activas:
- `id`: UUID
- `user_id`: Usuario
- `plan_type`: Plan actual
- `payment_id`: Referencia al pago
- `is_active`: Boolean
- `start_date`, `end_date`

## 🔧 Funciones Útiles

### Verificar expiración de trials
```sql
SELECT public.check_trial_expiration();
```

### Activar plan después de pago
```sql
SELECT public.activate_paid_plan(
  'user_id_here',
  'basico',
  'payment_id_here'
);
```

## 🚨 Troubleshooting

### El webhook no se recibe
- Verifica que la URL del webhook esté correctamente configurada en dLocalGo
- Confirma que la Edge Function está desplegada
- Revisa los logs en Supabase Dashboard

### El pago no se procesa
- Verifica las credenciales de API en las variables de entorno
- Confirma que estás usando el endpoint correcto (sandbox vs producción)
- Revisa los logs de la función `create-payment`

### El trial no se crea automáticamente
- Verifica que el trigger `on_auth_user_created` esté activo
- Confirma que la función `handle_new_user()` está actualizada
- Revisa los logs de PostgreSQL

## 📞 Soporte

Para problemas con dLocalGo:
- Documentación: https://docs.dlocalgo.com
- Soporte: support@dlocal.com

## 🔄 Próximos Pasos

- [ ] Implementar suscripciones recurrentes
- [ ] Agregar más métodos de pago
- [ ] Implementar sistema de cupones/descuentos
- [ ] Crear panel de administración para gestionar pagos
- [ ] Implementar facturación automática
