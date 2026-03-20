#!/bin/bash

# 🚀 Script de Despliegue Green API Integration
# Este script despliega las Edge Functions y el Frontend

set -e

echo "🚀 Iniciando despliegue de Green API Integration..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Pull del código
echo -e "${BLUE}📥 Paso 1: Actualizando código desde GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Código actualizado${NC}"
echo ""

# 2. Deploy de Edge Functions (via Docker volume copy)
echo -e "${BLUE}📡 Paso 2: Desplegando Edge Functions a Supabase...${NC}"

# Verificar que exista el volumen de Supabase
FUNCTIONS_VOLUME="/root/supabase-project/volumes/functions"

if [ ! -d "$FUNCTIONS_VOLUME" ]; then
    echo -e "${YELLOW}⚠️  Volumen de funciones no encontrado. Intentando crear...${NC}"
    sudo mkdir -p "$FUNCTIONS_VOLUME"
fi

echo -e "${YELLOW}   → Copiando green-api-webhook...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/green-api-webhook"
sudo cp -r supabase/functions/green-api-webhook "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando send-ai-message...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/send-ai-message"
sudo cp -r supabase/functions/send-ai-message "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando send-message...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/send-message"
sudo cp -r supabase/functions/send-message "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando meta-webhook...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/meta-webhook"
sudo cp -r supabase/functions/meta-webhook "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando meta-oauth...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/meta-oauth"
sudo cp -r supabase/functions/meta-oauth "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando _shared...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/_shared"
sudo cp -r supabase/functions/_shared "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando scrape-website...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/scrape-website"
sudo cp -r supabase/functions/scrape-website "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando fetch-business-info...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/fetch-business-info"
sudo cp -r supabase/functions/fetch-business-info "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando send-email...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/send-email"
sudo cp -r supabase/functions/send-email "$FUNCTIONS_VOLUME/"



# Funciones de pago
echo -e "${YELLOW}   → Copiando create-payment...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/create-payment"
sudo cp -r supabase/functions/create-payment "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando payment-webhook...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/payment-webhook"
sudo cp -r supabase/functions/payment-webhook "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando cancel-subscription...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/cancel-subscription"
sudo cp -r supabase/functions/cancel-subscription "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando verify-subscription...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/verify-subscription"
sudo cp -r supabase/functions/verify-subscription "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando create-green-api-instance...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/create-green-api-instance"
sudo cp -r supabase/functions/create-green-api-instance "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando setup-green-api-webhooks...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/setup-green-api-webhooks"
sudo cp -r supabase/functions/setup-green-api-webhooks "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando delete-green-api-instance...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/delete-green-api-instance"
sudo cp -r supabase/functions/delete-green-api-instance "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Copiando expire-trials...${NC}"
sudo rm -rf "$FUNCTIONS_VOLUME/expire-trials"
sudo cp -r supabase/functions/expire-trials "$FUNCTIONS_VOLUME/"

echo -e "${YELLOW}   → Reiniciando Supabase Edge Runtime...${NC}"
docker restart supabase-edge-functions

echo -e "${GREEN}✅ Edge Functions desplegadas${NC}"
echo ""

# 3. Deploy del Frontend
echo -e "${BLUE}🌐 Paso 3: Desplegando Frontend...${NC}"
./deploy.sh deploy

echo ""
echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
echo ""
echo "📋 Resumen:"
echo "  ✅ Código actualizado desde GitHub"
echo "  ✅ Edge Functions desplegadas:"
echo "     - https://supabase.ondai.ai/functions/v1/green-api-webhook"
echo "     - https://supabase.ondai.ai/functions/v1/send-ai-message"
echo "     - https://supabase.ondai.ai/functions/v1/create-payment"
echo "     - https://supabase.ondai.ai/functions/v1/payment-webhook"
echo "     - https://supabase.ondai.ai/functions/v1/verify-subscription"
echo "     - https://supabase.ondai.ai/functions/v1/create-green-api-instance"
echo "     - https://supabase.ondai.ai/functions/v1/setup-green-api-webhooks"
echo "     - https://supabase.ondai.ai/functions/v1/delete-green-api-instance"
echo "  ✅ Frontend reconstruido y desplegado"
echo ""
echo "🧪 Próximos pasos para probar:"
echo "  1. Ve a https://ondai.ai/dashboard"
echo "  2. Ve a Canales → Green API"
echo "  3. Conecta tu WhatsApp con el QR"
echo "  4. Envía un mensaje de prueba"
echo ""
