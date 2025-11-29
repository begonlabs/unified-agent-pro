import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessInfo {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zip?: string;
    };
    description?: string;
    category?: string;
    imported_at: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { page_id, access_token, channel_type } = await req.json()

        if (!page_id || !access_token) {
            return new Response(
                JSON.stringify({ error: 'page_id and access_token are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Fetching business info for ${channel_type}: ${page_id}`);

        let businessInfo: BusinessInfo = {
            imported_at: new Date().toISOString()
        };

        // Fetch based on channel type
        if (channel_type === 'facebook' || channel_type === 'instagram') {
            // Facebook Page or Instagram Business Account
            const fields = 'name,phone,emails,website,about,category,location,description,username';
            const url = `https://graph.facebook.com/v18.0/${page_id}?fields=${fields}&access_token=${access_token}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.text();
                console.error('Meta API error:', error);
                throw new Error(`Meta API error: ${error}`);
            }

            const data = await response.json();
            console.log('Meta API response:', data);

            // Extract business info
            businessInfo.name = data.name;
            businessInfo.phone = data.phone;
            businessInfo.email = data.emails?.[0];
            businessInfo.website = data.website;
            businessInfo.description = data.about || data.description;
            businessInfo.category = data.category;

            // Extract address from location
            if (data.location) {
                businessInfo.address = {
                    street: data.location.street,
                    city: data.location.city,
                    state: data.location.state,
                    country: data.location.country,
                    zip: data.location.zip
                };
            }

        } else if (channel_type === 'whatsapp') {
            // WhatsApp Business Profile
            // Note: For WhatsApp, we need the phone_number_id, not the page_id
            const url = `https://graph.facebook.com/v18.0/${page_id}/whatsapp_business_profile?access_token=${access_token}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.text();
                console.error('WhatsApp API error:', error);
                throw new Error(`WhatsApp API error: ${error}`);
            }

            const result = await response.json();
            const profile = result.data?.[0];

            if (profile) {
                console.log('WhatsApp Business Profile:', profile);

                businessInfo.name = profile.about; // WhatsApp uses 'about' as business name
                businessInfo.description = profile.description;
                businessInfo.email = profile.email;
                businessInfo.website = profile.websites?.[0];
                businessInfo.address = profile.address ? {
                    street: profile.address
                } : undefined;
                businessInfo.category = profile.vertical; // Industry vertical
            }
        }

        // Format for knowledge base
        const knowledgeBaseText = formatForKnowledgeBase(businessInfo);

        return new Response(
            JSON.stringify({
                success: true,
                business_info: businessInfo,
                knowledge_base_text: knowledgeBaseText
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

function formatForKnowledgeBase(info: BusinessInfo): string {
    const lines: string[] = [];

    lines.push('## Información del Negocio');
    lines.push('');

    if (info.name) {
        lines.push(`**Nombre del Negocio:** ${info.name}`);
    }

    if (info.category) {
        lines.push(`**Categoría:** ${info.category}`);
    }

    if (info.description) {
        lines.push(`**Descripción:** ${info.description}`);
    }

    if (info.phone) {
        lines.push(`**Teléfono:** ${info.phone}`);
    }

    if (info.email) {
        lines.push(`**Email:** ${info.email}`);
    }

    if (info.website) {
        lines.push(`**Sitio Web:** ${info.website}`);
    }

    if (info.address) {
        const addressParts = [
            info.address.street,
            info.address.city,
            info.address.state,
            info.address.zip,
            info.address.country
        ].filter(Boolean);

        if (addressParts.length > 0) {
            lines.push(`**Dirección:** ${addressParts.join(', ')}`);
        }
    }

    lines.push('');
    lines.push(`*Información importada automáticamente el ${new Date(info.imported_at).toLocaleDateString('es-ES')}*`);

    return lines.join('\n');
}
