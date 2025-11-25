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

# 2. Deploy de Edge Functions
echo -e "${BLUE}📡 Paso 2: Desplegando Edge Functions a Supabase...${NC}"
echo -e "${YELLOW}   → Desplegando green-api-webhook...${NC}"
supabase functions deploy green-api-webhook

echo -e "${YELLOW}   → Desplegando send-ai-message...${NC}"
supabase functions deploy send-ai-message

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
echo "  ✅ Frontend reconstruido y desplegado"
echo ""
echo "🧪 Próximos pasos para probar:"
echo "  1. Ve a https://ondai.ai/dashboard"
echo "  2. Ve a Canales → Green API"
echo "  3. Conecta tu WhatsApp con el QR"
echo "  4. Envía un mensaje de prueba"
echo ""
