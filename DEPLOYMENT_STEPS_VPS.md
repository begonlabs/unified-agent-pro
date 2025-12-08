# Pasos para Aplicar el Fix de Plan Limits en el VPS

## 1. Conectar al VPS (ya estás conectado)
```bash
ssh root@37.27.20.208
```

## 2. Navegar al directorio del proyecto
```bash
cd /root/unified-agent-pro
# O el path donde esté tu proyecto
```

## 3. Hacer pull de los últimos cambios
```bash
git pull origin main
```

## 4. Verificar que los archivos nuevos están presentes
```bash
ls -la supabase/migrations/20251208000001_fix_basico_plan_limits.sql
ls -la deploy-plan-limits-fix.sh
ls -la verify-plan-limits.sql
```

## 5. Aplicar la migración a la base de datos

### Opción A: Via Supabase CLI (si está instalado)
```bash
cd /root/unified-agent-pro
supabase db push
```

### Opción B: Via psql directo (si tienes acceso a la DB)
```bash
# Primero, verificar la conexión a la DB
psql $DATABASE_URL -c "SELECT version();"

# Aplicar la migración
psql $DATABASE_URL -f supabase/migrations/20251208000001_fix_basico_plan_limits.sql
```

### Opción C: Via Supabase Dashboard (más seguro)
1. Abre el Supabase Dashboard en el navegador
2. Ve a **SQL Editor**
3. Copia el contenido de `supabase/migrations/20251208000001_fix_basico_plan_limits.sql`
4. Pégalo en el editor y ejecuta

## 6. Verificar que la migración se aplicó correctamente
```bash
# Ejecutar las queries de verificación
psql $DATABASE_URL -f verify-plan-limits.sql

# O manualmente:
psql $DATABASE_URL -c "
SELECT 
  plan_type,
  COUNT(*) as total_users,
  MIN(messages_limit) as min_msg_limit,
  MAX(messages_limit) as max_msg_limit
FROM profiles
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
GROUP BY plan_type;
"
```

## 7. Redesplegar el Edge Function del webhook (si es necesario)
```bash
# Si usas Supabase CLI
supabase functions deploy payment-webhook

# O si tienes un script de deploy
./deploy-functions.sh
```

## 8. Verificar con el usuario afectado
- Pide al usuario que cierre sesión
- Que vuelva a iniciar sesión
- Que verifique en Perfil → Suscripción que ahora muestra "X/10000" en lugar de "X/0"

## 9. Monitorear logs
```bash
# Ver logs del webhook en Supabase Dashboard
# Edge Functions → payment-webhook → Logs

# O si tienes acceso a logs de PostgreSQL:
tail -f /var/log/postgresql/postgresql-*.log | grep "configure_plan_limits"
```

## Notas Importantes

- ✅ La migración es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- ✅ Incluye un **trigger automático** que previene futuros problemas
- ✅ El webhook tiene **fallback** en caso de que algo falle
- ⚠️ Si usas Opción C (Dashboard), asegúrate de copiar TODO el contenido del archivo SQL

## En caso de problemas

Si algo falla, puedes ejecutar manualmente esta query para corregir un usuario específico:

```sql
-- Reemplaza 'USER_EMAIL' con el email del usuario afectado
SELECT configure_plan_limits(
  user_id, 
  plan_type
)
FROM profiles 
WHERE email = 'USER_EMAIL';
```
