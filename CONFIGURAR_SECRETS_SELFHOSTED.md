# 🔐 Configurar Secrets para Supabase Self-Hosted

## Para Supabase Self-Hosted, los secrets van en archivos .env

### Opción 1: Archivo .env global de Supabase

```bash
# En tu VPS, edita el archivo .env de Supabase
nano /root/supabase-project/.env

# O si está en otro lugar:
nano /root/supabase/.env
```

Agrega estas líneas al final:
```bash
# dLocalGo Payment Configuration
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
PUBLIC_URL=https://ondai.ai
```

Guarda (Ctrl+O, Enter, Ctrl+X)

### Opción 2: Archivo .env en cada función (Recomendado para self-hosted)

Crea archivos `.env` en cada carpeta de función:

```bash
# create-payment
cat > /root/supabase-project/volumes/functions/create-payment/.env << 'EOF'
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
SUPABASE_URL=https://supabase.ondai.ai
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
PUBLIC_URL=https://ondai.ai
EOF

# payment-webhook
cat > /root/supabase-project/volumes/functions/payment-webhook/.env << 'EOF'
DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
SUPABASE_URL=https://supabase.ondai.ai
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
EOF

# verify-subscription
cat > /root/supabase-project/volumes/functions/verify-subscription/.env << 'EOF'
SUPABASE_URL=https://supabase.ondai.ai
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
EOF
```

**IMPORTANTE**: Reemplaza `tu_service_role_key_aqui` con tu service role key real.

### Opción 3: Variables de entorno en Docker Compose

Edita el docker-compose.yml de Supabase:

```bash
nano /root/supabase-project/docker-compose.yml
```

Busca la sección de `edge-functions` y agrega:

```yaml
edge-functions:
  environment:
    - DLOCALGO_API_KEY=TWknwsAtJgazlDsawRIrCYLFJpJNOYMR
    - DLOCALGO_SECRET_KEY=ApizLughS0RbihFquK651wpQoJmK9rJUpagMrUBg
    - DLOCALGO_API_URL=https://api-sbx.dlocalgo.com
    - PUBLIC_URL=https://ondai.ai
```

Luego reinicia:
```bash
docker-compose restart edge-functions
```

---

## 🚀 Después de configurar, reinicia las funciones:

```bash
docker restart supabase-edge-functions
```

## 🧪 Prueba que funciona:

```bash
# Verificar que las variables están disponibles
docker exec supabase-edge-functions env | grep DLOCALGO
```

---

## ¿Cuál opción usar?

- **Opción 1**: Más simple, pero las variables están en un solo lugar
- **Opción 2**: Más seguro, cada función tiene sus propias variables
- **Opción 3**: Más limpio, todo en docker-compose

**Recomendación**: Usa la **Opción 3** (docker-compose) porque es más fácil de mantener.
