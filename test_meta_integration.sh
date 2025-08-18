#!/bin/bash

echo "🧪 Script de Prueba - Integración Meta (Facebook/Instagram)"
echo "=========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs base
SUPABASE_BASE="https://supabase.ondai.ai"
WEBHOOK_URL="${SUPABASE_BASE}/functions/v1/meta-webhook"
OAUTH_URL="${SUPABASE_BASE}/functions/v1/meta-oauth"

echo -e "${BLUE}1. Probando Webhook...${NC}"
echo "URL: ${WEBHOOK_URL}"

# Test webhook verification
WEBHOOK_TEST=$(curl -s "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=e1a98cddfe719a46ee67fd1872c01d96&hub.challenge=ping")

if [ "$WEBHOOK_TEST" = "ping" ]; then
    echo -e "${GREEN}✅ Webhook funcionando correctamente${NC}"
else
    echo -e "${RED}❌ Webhook no responde correctamente${NC}"
    echo "Respuesta: $WEBHOOK_TEST"
fi

echo ""
echo -e "${BLUE}2. Probando OAuth endpoint...${NC}"
echo "URL: ${OAUTH_URL}"

# Test OAuth endpoint with fake code
OAUTH_TEST=$(curl -s "${OAUTH_URL}?code=fake-code-to-test")

if echo "$OAUTH_TEST" | grep -q "Missing authorization code"; then
    echo -e "${GREEN}✅ OAuth endpoint funcionando correctamente${NC}"
    echo "Respuesta esperada: Error por código faltante"
else
    echo -e "${YELLOW}⚠️  OAuth endpoint responde inesperadamente${NC}"
    echo "Respuesta: $OAUTH_TEST"
fi

echo ""
echo -e "${BLUE}3. Verificando configuración...${NC}"

# Check if required environment variables are mentioned in error responses
if echo "$OAUTH_TEST" | grep -q "debug"; then
    echo -e "${GREEN}✅ Debug information disponible${NC}"
else
    echo -e "${YELLOW}⚠️  Debug information no disponible${NC}"
fi

echo ""
echo -e "${BLUE}4. Resumen de la configuración:${NC}"
echo "• Webhook URL: ${WEBHOOK_URL}"
echo "• OAuth URL: ${OAUTH_URL}"
echo "• Verify Token: e1a98cddfe719a46ee67fd1872c01d96"
echo ""
echo -e "${YELLOW}📝 Para probar la integración completa:${NC}"
echo "1. Ve a tu dashboard de OndAI"
echo "2. Haz clic en 'Conectar Facebook'"
echo "3. Completa el flujo de OAuth"
echo "4. Verifica que se guarde en la base de datos"
echo ""
echo -e "${BLUE}🔧 Si hay problemas:${NC}"
echo "• Verifica las variables de entorno en Supabase"
echo "• Revisa el README de integración"
echo "• Verifica la configuración en Meta Developers"
