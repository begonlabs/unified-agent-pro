#!/bin/bash

echo "=== Instagram Debug Script ==="
echo ""

# 1. Check Docker logs for send-ai-message function
echo "📋 Checking send-ai-message logs (last 50 lines)..."
echo "================================================"
ssh root@37.27.20.208 "docker logs \$(docker ps -q -f name=supabase-edge-runtime) 2>&1 | grep -A 10 -B 5 'send-ai-message' | tail -50"
echo ""

# 2. Check if Instagram channel exists and has correct config
echo "📊 Checking Instagram channel configuration..."
echo "================================================"
ssh root@37.27.20.208 "docker exec -it \$(docker ps -q -f name=supabase-db) psql -U postgres -d postgres -c \"SELECT id, user_id, channel_type, is_connected, channel_config->>'username' as username, channel_config->>'page_id' as page_id, channel_config->>'instagram_business_account_id' as ig_business_id, LENGTH(channel_config->>'page_access_token') as token_length FROM communication_channels WHERE channel_type = 'instagram' ORDER BY created_at DESC LIMIT 1;\""
echo ""

# 3. Check recent conversations
echo "💬 Checking recent Instagram conversations..."
echo "================================================"
ssh root@37.27.20.208 "docker exec -it \$(docker ps -q -f name=supabase-db) psql -U postgres -d postgres -c \"SELECT id, channel, channel_thread_id, client_id, status, last_message_at FROM conversations WHERE channel = 'instagram' ORDER BY last_message_at DESC LIMIT 3;\""
echo ""

# 4. Check recent messages
echo "📨 Checking recent Instagram messages..."
echo "================================================"
ssh root@37.27.20.208 "docker exec -it \$(docker ps -q -f name=supabase-db) psql -U postgres -d postgres -c \"SELECT m.id, m.conversation_id, m.sender_type, m.content, m.created_at, m.metadata->>'platform' as platform FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.channel = 'instagram' ORDER BY m.created_at DESC LIMIT 5;\""
echo ""

echo "=== Debug Complete ==="
