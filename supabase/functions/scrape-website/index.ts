// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()

        if (!url) {
            return new Response(
                JSON.stringify({ error: 'URL is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Scraping URL: ${url}`);

        // 1. Fetch the website content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OndAI-Bot/1.0; +http://ondai.ai)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        // 2. Extract visible text (simple cleanup)
        // Remove scripts, styles, and HTML tags
        const textContent = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 15000); // Limit to ~15k chars to avoid token limits

        console.log(`Extracted ${textContent.length} characters of text`);

        // 3. Analyze with OpenAI
        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const prompt = `
      Analyze the following website content and extract key business information.
      Return ONLY a JSON object with the following fields (if information is found, otherwise empty string):
      - description: A summary of what the business does.
      - services: A list of services offered.
      - products: A list of products offered.
      - pricing: Any pricing information found.
      - contact: Contact details (email, phone, address).
      - about: Mission, vision, or "about us" information.

      Website Content:
      ${textContent}
    `;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Use a fast, capable model
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that extracts business information from website text. You output only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            }),
        });

        if (!aiResponse.ok) {
            const error = await aiResponse.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const aiData = await aiResponse.json();
        const result = JSON.parse(aiData.choices[0].message.content);

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
