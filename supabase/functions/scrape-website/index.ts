// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

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

        // 2. Extract visible text using a better strategy
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (!doc) {
            throw new Error("Failed to parse HTML");
        }

        // Remove unwanted elements
        const scripts = doc.querySelectorAll("script, style, noscript, iframe, svg, header, footer, nav");
        scripts.forEach((node) => node.remove());

        // Extract text safely
        let textContent = "";

        // Helper to check if an element is visible-ish (not precise in Deno but better than nothing)
        // We will traverse the body and pick up text nodes
        const walker = (node: any) => {
            if (node.nodeType === 3) { // Text node
                const text = node.textContent.trim();
                // Filter out very short noise, but keep prices ($10) and short names
                if (text.length > 1) {
                    textContent += text + " ";
                }
            } else if (node.nodeType === 1) { // Element node
                // Add newline for block elements to preserve structure
                if (["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TR", "BR"].includes(node.tagName)) {
                    textContent += "\n";
                }

                if (node.childNodes) {
                    node.childNodes.forEach(walker);
                }
            }
        };

        if (doc.body) {
            walker(doc.body);
        }

        // Fallback
        if (textContent.length < 100) {
            textContent = doc.body?.textContent || "";
        }

        // Clean up whitespace: replace multiple spaces with one, but keep newlines
        textContent = textContent.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();

        // Limit length
        textContent = textContent.substring(0, 15000); // Increased slightly as we have better noise filter

        console.log(`Extracted ${textContent.length} characters of text`);

        // 3. Analyze with OpenAI
        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        // Updated Schema for products
        const prompt = `
      Analyze the following website content and extract key business information.
      The content is scraped from a website (possibly e-commerce).
      
      Return ONLY a JSON object with the following fields:
      - description: A clear summary of what the business does (IN SPANISH).
      - services: A list of services offered (as a simple string array, IN SPANISH).
      - products: A list of detailed product objects with: { "name": "...", "price": "...", "description": "..." }. If no products found, return empty array. Translate descriptions to Spanish.
      - pricing: General pricing information if available (e.g. "Subscriptions start at $10"). (IN SPANISH)
      - contact: Contact details (email, phone, address).
      - about: Mission, vision, or "about us" information (IN SPANISH).

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
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that extracts business information. For products, you are precise with names and prices. IMPORTANT: You MUST output all textual descriptions in SPANISH, regardless of the source language.' },
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
