# 🚨 PASOS URGENTES PARA ACTIVAR EL SISTEMA DE PAGOS

## ⚠️ El error que ves es porque falta desplegar

Necesitas hacer estos pasos **EN ORDEN**:

---

## 1️⃣ PRIMERO: Aplicar Migración en Supabase (5 minutos)

### Ve a Supabase Dashboard:
1. Abre: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New query**

### Copia y pega este SQL:

Abre el archivo: `supabase/migrations/MANUAL_MIGRATION_PAYMENT_SYSTEM.sql`

**Copia TODO el contenido** y pégalo en el SQL Editor, luego click en **RUN**

### Verificar que funcionó:
```sql
-- Ejecuta esto para verificar
SELECT * FROM public.payments LIMIT 1;
SELECT * FROM public.subscriptions LIMIT 1;
```

Si no da error, ¡está listo! ✅

---

## 2️⃣ SEGUNDO: Desplegar Edge Functions en VPS (3 minutos)

### En tu terminal SSH (ya conectado):

```bash
# Ya estás en el VPS, ahora:
cd /root/unified-agent-pro

# Actualizar código
git pull origin main

# Desplegar funciones
./deploy-green-api.sh
```

Esto desplegará automáticamente las 3 funciones de pago.

---

## 3️⃣ TERCERO: Configurar Variables de Entorno en Supabase

### Ve a Supabase Dashboard:
1. Settings > Edge Functions > **Manage secrets**
2. Agrega estas variables (una por una):

```
DLOCALGO_API_KEY = TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY = ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_API_URL = https://api-sbx.dlocalgo.com
PUBLIC_URL = https://ondai.ai
```

---

## 4️⃣ CUARTO: Probar de nuevo

1. Recarga la página: https://ondai.ai
2. Ve a Perfil > Suscripción
3. Click en "Cambiar a Básico"
4. Click en "Pagar Ahora"

Ahora debería funcionar ✅

---

## 🔍 Verificar que las funciones están desplegadas

Desde tu VPS:
```bash
# Verificar que las carpetas existen
ls -la /root/supabase-project/volumes/functions/ | grep payment

# Deberías ver:
# create-payment/
# payment-webhook/
# verify-subscription/
```

---

## 🆘 Si sigue sin funcionar

Revisa los logs de las Edge Functions:
```bash
docker logs supabase-edge-functions --tail 100
```

O prueba manualmente la función:
```bash
curl -X POST https://supabase.ondai.ai/functions/v1/create-payment \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan_type": "basico", "user_id": "test"}'
```

---

## ⏱️ Tiempo estimado total: 10-15 minutos

1. SQL en Supabase: 5 min
2. Deploy en VPS: 3 min
3. Variables de entorno: 2 min
4. Prueba: 1 min

¡Avísame cuando termines cada paso!
