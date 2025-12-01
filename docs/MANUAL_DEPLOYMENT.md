# 📋 Instrucciones de Despliegue Manual

## 1️⃣ Migración de Base de Datos en Supabase

### Opción A: Usando el SQL Editor (Recomendado)

1. **Accede a tu proyecto de Supabase**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, click en "SQL Editor"
   - Click en "New query"

3. **Copia y pega el SQL**
   - Abre el archivo: `supabase/migrations/MANUAL_MIGRATION_PAYMENT_SYSTEM.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta la migración**
   - Click en "Run" o presiona `Ctrl+Enter`
   - Espera a que termine (debería tomar unos segundos)

5. **Verifica que funcionó**
   - Al final del script hay queries de verificación
   - Deberías ver las tablas `payments` y `subscriptions` creadas
   - Los campos nuevos en `profiles` deberían aparecer

### Opción B: Usando psql (Línea de comandos)

Si prefieres usar la terminal:

```bash
# Obtén tu connection string de Supabase Dashboard > Settings > Database
# Formato: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

psql "postgresql://postgres:tu_password@db.xxx.supabase.co:5432/postgres" \
  -f supabase/migrations/MANUAL_MIGRATION_PAYMENT_SYSTEM.sql
```

---

## 2️⃣ Desplegar Edge Functions en VPS

### Paso 1: Actualizar el código

```bash
# En tu VPS (ya conectado por SSH)
cd /root/unified-agent-pro
git pull origin main
```

### Paso 2: Ejecutar el script de deploy actualizado

```bash
# El script ya está actualizado para incluir las funciones de pago
./deploy-green-api.sh
```

El script ahora desplegará automáticamente:
- ✅ `create-payment`
- ✅ `payment-webhook`
- ✅ `verify-subscription`
- ✅ Todas las funciones anteriores

### Paso 3: Verificar que se desplegaron

```bash
# Verificar que las funciones están en el volumen
ls -la /root/supabase-project/volumes/functions/

# Deberías ver:
# - create-payment/
# - payment-webhook/
# - verify-subscription/
```

### Paso 4: Verificar que funcionan

```bash
# Probar create-payment
curl -X POST https://supabase.ondai.ai/functions/v1/create-payment \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan_type": "basico", "user_id": "test"}'

# Deberías recibir una respuesta (aunque falle por user_id inválido, 
# significa que la función está corriendo)
```

---

## 3️⃣ Configurar Variables de Entorno

### En Supabase Dashboard

1. Ve a **Settings** > **Edge Functions** > **Secrets**
2. Agrega las siguientes variables:

```bash
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
PUBLIC_URL=https://ondai.ai
```

### En tu VPS (archivo .env)

```bash
# Edita el archivo .env
nano /root/unified-agent-pro/.env

# Agrega al final:
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
PUBLIC_URL=https://ondai.ai
```

---

## 4️⃣ Configurar Webhook en dLocalGo

1. **Inicia sesión en dLocalGo**
   - Ve a https://dashboard.dlocalgo.com (sandbox)

2. **Configura el webhook**
   - Settings > Webhooks > Add Webhook
   - URL: `https://supabase.ondai.ai/functions/v1/payment-webhook`
   - Eventos: `payment.approved`, `payment.rejected`, `payment.cancelled`
   - Guarda el **Webhook Secret** que te dan

3. **Agrega el secret a Supabase**
   - En Supabase Dashboard > Settings > Edge Functions > Secrets
   - Agrega: `DLOCALGO_WEBHOOK_SECRET=el_secret_que_te_dieron`

---

## 5️⃣ Verificación Final

### Verificar Base de Datos

```sql
-- En Supabase SQL Editor
SELECT * FROM public.payments LIMIT 1;
SELECT * FROM public.subscriptions LIMIT 1;
SELECT trial_start_date, trial_end_date, is_trial, payment_status 
FROM public.profiles LIMIT 1;
```

### Verificar Edge Functions

```bash
# Desde tu VPS
curl https://supabase.ondai.ai/functions/v1/verify-subscription?user_id=test
```

### Probar Flujo Completo

1. Registra un nuevo usuario en https://ondai.ai
2. Ve a Perfil > Suscripción
3. Deberías ver:
   - ✅ Badge de "Prueba"
   - ✅ Contador de 7 días
   - ✅ Planes Básico, Avanzado y Pro
4. Intenta seleccionar un plan
5. Deberías ver el modal de pago

---

## 🚨 Troubleshooting

### Error: "Tabla ya existe"
Si ya ejecutaste parte de la migración:
```sql
-- Verifica qué tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'subscriptions');

-- Si ya existen, puedes saltarte esos pasos
```

### Error: "Function already exists"
```sql
-- Elimina la función y vuelve a crearla
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- Luego ejecuta de nuevo el CREATE FUNCTION
```

### Edge Functions no se actualizan
```bash
# Reinicia el contenedor de Edge Functions
docker restart supabase-edge-functions

# Verifica los logs
docker logs supabase-edge-functions --tail 50
```

---

## ✅ Checklist de Despliegue

- [ ] Migración SQL ejecutada en Supabase
- [ ] Tablas `payments` y `subscriptions` creadas
- [ ] Campos agregados a `profiles`
- [ ] Funciones `handle_new_user()`, `check_trial_expiration()`, `activate_paid_plan()` creadas
- [ ] Edge Functions desplegadas en VPS
- [ ] Variables de entorno configuradas en Supabase
- [ ] Webhook configurado en dLocalGo
- [ ] Prueba de registro de usuario nuevo exitosa
- [ ] Modal de pago se muestra correctamente

---

¿Necesitas ayuda con algún paso? ¡Avísame!
