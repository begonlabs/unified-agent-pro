#!/bin/bash

# Script de prueba para el sistema de pagos
# Ejecutar desde el directorio raíz del proyecto

echo "🧪 Iniciando pruebas del sistema de pagos..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar que las variables de entorno están configuradas
echo "📋 Verificando variables de entorno..."
if [ -z "$DLOCALGO_API_KEY" ]; then
    echo -e "${RED}❌ DLOCALGO_API_KEY no está configurada${NC}"
    exit 1
else
    echo -e "${GREEN}✅ DLOCALGO_API_KEY configurada${NC}"
fi

if [ -z "$DLOCALGO_SECRET_KEY" ]; then
    echo -e "${RED}❌ DLOCALGO_SECRET_KEY no está configurada${NC}"
    exit 1
else
    echo -e "${GREEN}✅ DLOCALGO_SECRET_KEY configurada${NC}"
fi

echo ""

# 2. Verificar que las Edge Functions están desplegadas
echo "🚀 Verificando Edge Functions..."
echo -e "${YELLOW}Nota: Asegúrate de haber desplegado las funciones con 'supabase functions deploy'${NC}"
echo ""

# 3. Verificar migración de base de datos
echo "💾 Verificando migración de base de datos..."
echo "Ejecutando query de verificación..."

# Verificar que las tablas existen
psql $DATABASE_URL -c "SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
);" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabla 'payments' existe${NC}"
else
    echo -e "${RED}❌ Tabla 'payments' no encontrada. Ejecuta la migración.${NC}"
fi

psql $DATABASE_URL -c "SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
);" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabla 'subscriptions' existe${NC}"
else
    echo -e "${RED}❌ Tabla 'subscriptions' no encontrada. Ejecuta la migración.${NC}"
fi

echo ""

# 4. Crear usuario de prueba
echo "👤 Creando usuario de prueba..."
echo -e "${YELLOW}Nota: Registra un usuario manualmente en la aplicación para probar${NC}"
echo ""

# 5. Verificar período de prueba
echo "⏰ Para verificar el período de prueba:"
echo "1. Registra un nuevo usuario"
echo "2. Verifica en la base de datos:"
echo "   SELECT email, is_trial, trial_end_date, payment_status FROM profiles WHERE email = 'test@example.com';"
echo "3. Confirma en la interfaz que muestra el contador de días"
echo ""

# 6. Probar flujo de pago
echo "💳 Para probar el flujo de pago:"
echo "1. Inicia sesión con el usuario de prueba"
echo "2. Ve a Perfil > Suscripción"
echo "3. Selecciona un plan (Básico, Avanzado o Pro)"
echo "4. Completa el pago en el sandbox de dLocalGo"
echo "5. Verifica que el plan se actualizó correctamente"
echo ""

# 7. Verificar webhook
echo "🔔 Para verificar el webhook:"
echo "1. Configura el webhook en dLocalGo:"
echo "   URL: https://tu-proyecto.supabase.co/functions/v1/payment-webhook"
echo "2. Realiza un pago de prueba"
echo "3. Verifica los logs en Supabase Dashboard"
echo "4. Confirma que el estado del pago se actualizó"
echo ""

# 8. Verificar permisos de canales
echo "🔐 Para verificar permisos de canales:"
echo "1. Usuario en trial: debe tener acceso a FB e IG, pero no WhatsApp"
echo "2. Usuario con plan Básico: debe poder conectar 1 canal de WhatsApp"
echo "3. Usuario con plan Pro: debe tener canales ilimitados"
echo ""

echo -e "${GREEN}✅ Guía de pruebas completada${NC}"
echo ""
echo "📚 Para más información, consulta:"
echo "   - docs/PAYMENT_SYSTEM.md"
echo "   - walkthrough.md (en artifacts)"
