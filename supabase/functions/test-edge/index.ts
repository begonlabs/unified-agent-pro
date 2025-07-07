
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Test Edge Function loaded")

serve(async (req) => {
  const { method } = req
  
  // Handle CORS
  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'apikey, X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization',
      },
    })
  }

  try {
    console.log("Test function called successfully")
    
    const response = {
      success: true,
      message: "Edge Functions están funcionando correctamente en tu Supabase self-hosted!",
      timestamp: new Date().toISOString(),
      environment: "self-hosted",
      deno_version: Deno.version.deno,
      capabilities: {
        http_requests: true,
        database_access: true,
        env_variables: !!Deno.env.get("SUPABASE_URL")
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Error in test function:", error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      },
    )
  }
})
