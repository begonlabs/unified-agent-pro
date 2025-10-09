// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: WhatsApp Business API Embedded Signup Handler
// whatsapp-embedded-signup/index.ts
// Production Ready WhatsApp Business API Embedded Signup Handler with Enhanced Debugging and Retry Mechanism
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types and Interfaces
interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  account_review_status: string;
  business_verification_status: string;
}

interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
  status?: string;
}

interface ConfigurationVariables {
  appId: string;
  appSecret: string;
  graphVersion: string;
  webhookUrl: string;
  verifyToken: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  frontendUrl: string;
  environment: string;
}

interface RequestPayload {
  code: string;
  state: string;
  userId: string;
}

interface StateData {
  user_id: string;
  timestamp: number;
  nonce: string;
}

// Configuration and Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Retry configuration for WABA fetch - Optimized for Supabase timeout
const WABA_RETRY_CONFIG = {
  maxAttempts: 6, // Reduced to prevent timeout
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds max
  backoffMultiplier: 1.5 // Faster backoff
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Utility Functions
function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  clientData.count++;
  return false;
}

function validateConfiguration(): ConfigurationVariables {
  const config = {
    appId: Deno.env.get('WHATSAPP_APP_ID') || Deno.env.get('META_APP_ID'),
    appSecret: Deno.env.get('WHATSAPP_APP_SECRET') || Deno.env.get('META_APP_SECRET'),
    graphVersion: Deno.env.get('META_GRAPH_VERSION') || 'v23.0',
    webhookUrl: Deno.env.get('WHATSAPP_WEBHOOK_URL') || 'https://supabase.ondai.ai/functions/v1/whatsapp-webhook',
    verifyToken: Deno.env.get('WHATSAPP_VERIFY_TOKEN'),
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    frontendUrl: Deno.env.get('FRONTEND_URL') || 'https://ondai.ai',
    environment: Deno.env.get('ENVIRONMENT') || 'production'
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'environment')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config as ConfigurationVariables;
}

function sanitizeInput(input: unknown): string | number | boolean | null {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000); // Limit string length
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  return null;
}

function validateStateParameter(state: string): StateData {
  try {
    const decoded = decodeURIComponent(state);
    const parsed = JSON.parse(decoded);
    
    if (!parsed.user_id || !parsed.timestamp || !parsed.nonce) {
      throw new Error('Invalid state structure');
    }
    
    // Check if state is not too old (max 1 hour)
    const stateAge = Date.now() - parsed.timestamp;
    if (stateAge > 3600000) {
      throw new Error('State parameter expired');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Invalid state parameter: ${error.message}`);
  }
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = MAX_RETRY_ATTEMPTS): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx) - retry
      if (attempt === maxRetries) {
        return response;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  throw new Error('Max retry attempts exceeded');
}

function logEvent(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'whatsapp-embedded-signup',
    ...metadata
  };
  
  // In production, send to logging service
  console.log(JSON.stringify(logEntry));
}

async function exchangeCodeForToken(code: string, config: ConfigurationVariables): Promise<string> {
  logEvent('info', 'Exchanging authorization code for access token');
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`,
    {
      method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
        client_id: config.appId,
        client_secret: config.appSecret,
            code: code
          }).toString()
        }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'Token exchange failed', { status: response.status, error: errorText });
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  
  if (!tokenData.access_token) {
    logEvent('error', 'No access token in response', { tokenData });
    throw new Error('No access token received from Facebook');
  }

  // Log FULL token response to see if there's additional data from Embedded Signup
  logEvent('info', 'Token exchange successful', { 
    hasAccessToken: !!tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    // Check for additional fields that Embedded Signup might return
    hasBusinessId: !!tokenData.business_id,
    hasWabaId: !!tokenData.waba_id,
    additionalFields: Object.keys(tokenData).filter(k => 
      !['access_token', 'token_type', 'expires_in'].includes(k)
    )
  });
  
  return tokenData.access_token;
}

// Helper function to check token info for Business Integration System data
// Returns array of WABA IDs found in granular scopes
async function checkTokenBusinessIntegration(token: string, config: ConfigurationVariables): Promise<string[]> {
  try {
    // Get app access token for debug token call
    const appTokenResponse = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/oauth/access_token?client_id=${config.appId}&client_secret=${config.appSecret}&grant_type=client_credentials`
    );
    
    if (appTokenResponse.ok) {
      const appTokenData = await appTokenResponse.json();
      const appToken = appTokenData.access_token;
      
      // Use debug_token endpoint to get detailed token information
      const debugResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/debug_token?input_token=${token}&access_token=${appToken}`
      );
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        const granularScopes = debugData.data?.granular_scopes || [];
        
        logEvent('info', 'Token debug with app token', { 
          debugInfo: debugData.data,
          granularScopes: granularScopes,
          profileId: debugData.data?.profile_id,
          dataAccessExpiresAt: debugData.data?.data_access_expires_at
        });
        
        // CRITICAL: Extract WABA IDs from granular scopes
        // This is the key to finding WABAs created through Embedded Signup
        const wabaIds = new Set<string>();
        for (const scope of granularScopes) {
          if (
            (scope.scope === 'whatsapp_business_management' || 
             scope.scope === 'whatsapp_business_messaging') &&
            scope.target_ids
          ) {
            for (const targetId of scope.target_ids) {
              wabaIds.add(targetId);
            }
          }
        }
        
        if (wabaIds.size > 0) {
          logEvent('info', 'WABA IDs found in granular scopes!', { 
            wabaIds: Array.from(wabaIds)
          });
          return Array.from(wabaIds);
        }
      }
    }
  } catch (error) {
    logEvent('warn', 'Could not debug token with app token', { error: error.message });
  }
  
  return [];
}

// Helper function to perform a single WABA search attempt
async function performWABASearch(token: string, config: ConfigurationVariables): Promise<WhatsAppBusinessAccount[]> {
  const allWabas: WhatsAppBusinessAccount[] = [];
  
  // First, check if token has business integration info and extract WABA IDs from granular scopes
  const wabaIdsFromScopes = await checkTokenBusinessIntegration(token, config);
  
  // PRIORITY 1: If we found WABA IDs in granular scopes, query them directly
  if (wabaIdsFromScopes.length > 0) {
    logEvent('info', 'Using WABA IDs from granular scopes', { 
      wabaCount: wabaIdsFromScopes.length,
      wabaIds: wabaIdsFromScopes
    });
    
    for (const wabaId of wabaIdsFromScopes) {
      try {
        const wabaResponse = await fetchWithRetry(
          `https://graph.facebook.com/${config.graphVersion}/${wabaId}?fields=id,name,account_review_status,business_verification_status&access_token=${token}`,
          { method: 'GET' }
        );
        
        if (wabaResponse.ok) {
          const wabaData = await wabaResponse.json();
          allWabas.push(wabaData);
          logEvent('info', 'WABA details fetched from granular scope ID', {
            wabaId: wabaData.id,
            wabaName: wabaData.name,
            reviewStatus: wabaData.account_review_status
          });
        } else {
          const errorText = await wabaResponse.text();
          logEvent('warn', 'Failed to fetch WABA from granular scope ID', {
            wabaId,
            status: wabaResponse.status,
            error: errorText
          });
        }
      } catch (error) {
        logEvent('warn', 'Error fetching WABA from granular scope', {
          wabaId,
          error: error.message
        });
      }
    }
    
    // If we found WABAs from granular scopes, return them immediately
    if (allWabas.length > 0) {
      logEvent('info', 'WABAs successfully found from granular scopes', {
        wabaCount: allWabas.length
      });
      return allWabas;
    }
  }
  
  // Debug del token para entender qué permisos tiene
  const debugResponse = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/debug_token?input_token=${token}&access_token=${config.appId}|${config.appSecret}`,
    { method: 'GET' }
  );

  if (debugResponse.ok) {
    const debugData = await debugResponse.json();
    logEvent('info', 'Token debug info', { 
      scopes: debugData.data?.scopes,
      appId: debugData.data?.app_id,
      userId: debugData.data?.user_id,
      isValid: debugData.data?.is_valid,
      expiresAt: debugData.data?.expires_at
    });
  } else {
    logEvent('warn', 'Token debug failed', { status: debugResponse.status });
  }

  // Debug de permisos específicos
  const permissionsResponse = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/me/permissions?access_token=${token}`,
    { method: 'GET' }
  );

  if (permissionsResponse.ok) {
    const permissionsData = await permissionsResponse.json();
    logEvent('info', 'User permissions', { 
      permissions: permissionsData.data?.map(p => `${p.permission}:${p.status}`) 
    });
  }

  // Enfoque 1: Obtener información del usuario para conseguir los Business IDs
  let userBusinesses: Array<{ id: string; name: string }> = [];
  try {
    const userResponse = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/me?fields=id,name&access_token=${token}`,
      { method: 'GET' }
    );

    if (userResponse.ok) {
      const userData = await userResponse.json();
      logEvent('info', 'User data obtained', { userId: userData.id, userName: userData.name });
      
      // Intentar obtener los negocios del usuario
      const businessesResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/me/businesses?access_token=${token}`,
        { method: 'GET' }
      );

      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        userBusinesses = businessesData.data || [];
        logEvent('info', 'User businesses found', { 
          businessCount: userBusinesses.length,
          businesses: userBusinesses.map(b => ({ id: b.id, name: b.name }))
        });
      } else {
        const errorText = await businessesResponse.text();
        logEvent('warn', 'User businesses fetch failed', { 
          status: businessesResponse.status, 
          error: errorText 
        });
        
        // If user has no businesses, this is likely the root cause
        if (businessesResponse.status === 400) {
          logEvent('error', 'User has no Business Manager account', {
            userId: userData.id,
            suggestion: 'User must create a Meta Business Manager account first'
          });
        }
      }
    } else {
      const errorText = await userResponse.text();
      logEvent('warn', 'User data fetch failed', { 
        status: userResponse.status, 
        error: errorText 
      });
    }
  } catch (userError) {
    logEvent('warn', 'User data fetch failed', { error: userError.message });
  }

  // Enfoque 2: Para cada business, intentar obtener sus WABAs
  for (const business of userBusinesses) {
    try {
      logEvent('info', 'Checking business for WABAs', { 
        businessId: business.id, 
        businessName: business.name 
      });

      // Intentar obtener WABAs propias del negocio
      const ownedWabasResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/${business.id}/owned_whatsapp_business_accounts?access_token=${token}`,
        { method: 'GET' }
      );

      if (ownedWabasResponse.ok) {
        const ownedWabasData = await ownedWabasResponse.json();
        const ownedWabas = ownedWabasData.data || [];
        allWabas.push(...ownedWabas);
        logEvent('info', 'Owned WABAs found', { 
          businessId: business.id, 
          wabaCount: ownedWabas.length,
          wabas: ownedWabas.map(w => ({ id: w.id, name: w.name }))
        });
      } else {
        const errorText = await ownedWabasResponse.text();
        logEvent('warn', 'Owned WABAs fetch failed', { 
          businessId: business.id, 
          status: ownedWabasResponse.status,
          error: errorText 
        });
      }

      // Intentar obtener WABAs compartidas con el negocio
      const clientWabasResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/${business.id}/client_whatsapp_business_accounts?access_token=${token}`,
        { method: 'GET' }
      );

      if (clientWabasResponse.ok) {
        const clientWabasData = await clientWabasResponse.json();
        const clientWabas = clientWabasData.data || [];
        allWabas.push(...clientWabas);
        logEvent('info', 'Client WABAs found', { 
          businessId: business.id, 
          wabaCount: clientWabas.length,
          wabas: clientWabas.map(w => ({ id: w.id, name: w.name }))
        });
      } else {
        const errorText = await clientWabasResponse.text();
        logEvent('warn', 'Client WABAs fetch failed', { 
          businessId: business.id, 
          status: clientWabasResponse.status,
          error: errorText 
        });
      }
    } catch (businessError) {
      logEvent('warn', 'Business WABA fetch failed', { 
        businessId: business.id, 
        error: businessError.message 
      });
    }
  }

  // Enfoque 3: Si no encontramos negocios, intentar directamente con el token de la app
  if (userBusinesses.length === 0) {
    logEvent('info', 'No businesses found, trying app-level endpoints');
    
    try {
      // Obtener información de la aplicación
      const appResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/${config.appId}?fields=id,name&access_token=${token}`,
        { method: 'GET' }
      );

      if (appResponse.ok) {
        const appData = await appResponse.json();
        logEvent('info', 'App data obtained', { appId: appData.id, appName: appData.name });
      } else {
        const errorText = await appResponse.text();
        logEvent('warn', 'App data fetch failed', { 
          status: appResponse.status, 
          error: errorText 
        });
      }

      // Para el flujo de Embedded Signup, las WABAs podrían estar disponibles directamente 
      // a través de la Graph API usando un endpoint específico para aplicaciones
      
      // Try 1: me/accounts with whatsapp_business_account type
      logEvent('info', 'Trying me/accounts endpoint for WABAs');
      const embeddedWabasResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/me/accounts?type=whatsapp_business_account&access_token=${token}`,
        { method: 'GET' }
      );

      if (embeddedWabasResponse.ok) {
        const embeddedWabasData = await embeddedWabasResponse.json();
        const embeddedWabas = embeddedWabasData.data || [];
        allWabas.push(...embeddedWabas);
        logEvent('info', 'Embedded WABAs from me/accounts found', { 
          wabaCount: embeddedWabas.length,
          wabas: embeddedWabas.map(w => ({ id: w.id, name: w.name }))
        });
      } else {
        const errorText = await embeddedWabasResponse.text();
        logEvent('warn', 'Embedded WABAs fetch failed', { 
          status: embeddedWabasResponse.status, 
          error: errorText 
        });
      }
      
      // Try 2: me/business_users endpoint (specific to Business Integration System)
      logEvent('info', 'Trying me/business_users endpoint');
      const businessUsersResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/me/business_users?access_token=${token}`,
        { method: 'GET' }
      );
      
      if (businessUsersResponse.ok) {
        const businessUsersData = await businessUsersResponse.json();
        const businessUsers = businessUsersData.data || [];
        logEvent('info', 'Business users found', { 
          userCount: businessUsers.length,
          users: businessUsers.map(u => ({ id: u.id, business: u.business }))
        });
        
        // For each business user, try to get their businesses
        for (const businessUser of businessUsers) {
          if (businessUser.business && businessUser.business.id) {
            try {
              const bizWabaResponse = await fetchWithRetry(
                `https://graph.facebook.com/${config.graphVersion}/${businessUser.business.id}/owned_whatsapp_business_accounts?access_token=${token}`,
                { method: 'GET' }
              );
              if (bizWabaResponse.ok) {
                const bizWabaData = await bizWabaResponse.json();
                const bizWabas = bizWabaData.data || [];
                allWabas.push(...bizWabas);
                logEvent('info', 'WABAs from business user found', {
                  businessId: businessUser.business.id,
                  wabaCount: bizWabas.length
                });
              }
            } catch (error) {
              logEvent('warn', 'Failed to fetch WABAs from business user', { 
                businessId: businessUser.business.id,
                error: error.message 
              });
            }
          }
        }
      } else {
        const errorText = await businessUsersResponse.text();
        logEvent('warn', 'Business users fetch failed', { 
          status: businessUsersResponse.status, 
          error: errorText 
        });
      }
      
      // Try 3: Direct WABA query with all fields
      logEvent('info', 'Trying me with WABA fields');
      const meWithWabaResponse = await fetchWithRetry(
        `https://graph.facebook.com/${config.graphVersion}/me?fields=id,name,whatsapp_business_accounts{id,name}&access_token=${token}`,
        { method: 'GET' }
      );
      
      if (meWithWabaResponse.ok) {
        const meWithWabaData = await meWithWabaResponse.json();
        if (meWithWabaData.whatsapp_business_accounts && meWithWabaData.whatsapp_business_accounts.data) {
          const meWabas = meWithWabaData.whatsapp_business_accounts.data;
          allWabas.push(...meWabas);
          logEvent('info', 'WABAs from me endpoint found', { 
            wabaCount: meWabas.length
          });
        }
      } else {
        const errorText = await meWithWabaResponse.text();
        logEvent('warn', 'me with WABA fields fetch failed', { 
          status: meWithWabaResponse.status, 
          error: errorText 
        });
      }

      // Note: me/whatsapp_business_accounts endpoint is deprecated
      // This endpoint no longer exists in the current Graph API
      logEvent('info', 'Skipping deprecated endpoint: me/whatsapp_business_accounts');

    } catch (appError) {
      logEvent('warn', 'App-based WABA fetch failed', { error: appError.message });
    }
  }

  // Eliminar duplicados basados en ID
  const uniqueWabas = allWabas.filter((waba, index, self) => 
    index === self.findIndex(w => w.id === waba.id)
  );

  return uniqueWabas;
}

// Enhanced function with retry mechanism for WABA propagation delays
async function fetchWhatsAppBusinessAccounts(token: string, config: ConfigurationVariables): Promise<WhatsAppBusinessAccount[]> {
  logEvent('info', 'Fetching WhatsApp Business Accounts with retry mechanism');
  
  let attempts = 0;
  const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = WABA_RETRY_CONFIG;
  let lastError: Error | null = null;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      logEvent('info', `WABA search attempt ${attempts}/${maxAttempts}`);
      
      // Perform the WABA search
      const uniqueWabas = await performWABASearch(token, config);
      
      if (uniqueWabas.length > 0) {
        logEvent('info', `WABAs found on attempt ${attempts}`, { 
          count: uniqueWabas.length,
          wabas: uniqueWabas.map(w => ({ id: w.id, name: w.name, status: w.account_review_status }))
        });
        return uniqueWabas;
      }
      
      // No WABAs found, log attempt details
      logEvent('info', `No WABAs found on attempt ${attempts}`, {
        attemptsRemaining: maxAttempts - attempts
      });
      
      // If this isn't the last attempt, wait before retrying
      if (attempts < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempts - 1), maxDelay);
        logEvent('info', `Waiting ${delay}ms before next attempt`, { 
          attempt: attempts,
          nextAttempt: attempts + 1,
          delay 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      lastError = error;
      logEvent('error', `WABA search attempt ${attempts} failed`, { 
        error: error.message,
        attemptsRemaining: maxAttempts - attempts
      });
      
      // If this is the last attempt, we'll throw the error below
      if (attempts === maxAttempts) {
        break;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempts - 1), maxDelay);
      logEvent('info', `Waiting ${delay}ms before retry after error`, { 
        attempt: attempts,
        delay 
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all attempts failed
  logEvent('info', 'WABA search summary', {
    totalAttempts: attempts,
    searchApproaches: {
      userBusinessesChecked: true,
      appLevelSearchChecked: true,
      retryMechanismUsed: true
    }
  });

  // Enfoque 4: Si estamos en desarrollo y no encontramos WABAs, crear una mock
  if (config.environment === 'development') {
    logEvent('info', 'Development mode: creating mock WABA after all retries failed');
    return [{
      id: 'dev_waba_' + Date.now(),
      name: 'Development WABA',
      account_review_status: 'APPROVED',
      business_verification_status: 'VERIFIED'
    }];
  }

  // Información detallada del error para debugging
  const errorDetails = {
    totalAttempts: attempts,
    lastError: lastError?.message,
    environment: config.environment,
    possibleCauses: [
      'Meta servers are still propagating the newly created WABA (this is common)',
      'User closed the Embedded Signup dialog before completing all steps',
      'WhatsApp Business Account creation failed in Meta\'s system',
      'Network issues preventing WABA data retrieval',
      'Token permissions insufficient for WABA access'
    ],
    suggestedActions: [
      'Wait a few minutes and try the connection process again',
      'Ensure the Embedded Signup process was completed entirely',
      'Check Meta Business Manager to verify WABA was created',
      'Verify app permissions in Meta for Developers console'
    ]
  };

  logEvent('error', 'No WABAs found after all retry attempts', errorDetails);
  
  const errorMessage = `No WhatsApp Business Accounts found after ${attempts} attempts.

This usually happens because:
• The Embedded Signup process wasn't completed fully
• User doesn't have a Meta Business Manager account
• The WhatsApp Business Account creation failed

NEXT STEPS:
1️⃣ Complete the WhatsApp Embedded Signup process in Meta Business Manager
2️⃣ Ensure you have a Business Manager account at https://business.facebook.com
3️⃣ Create a WhatsApp Business Account through the Embedded Signup flow
4️⃣ Wait 2-5 minutes after completing setup and try again

IMPORTANT: You must complete the full Embedded Signup process in Meta's interface before this integration can work.`;

  throw new Error(errorMessage);
}

async function fetchWABADetails(wabaId: string, token: string, config: ConfigurationVariables): Promise<WhatsAppBusinessAccount> {
  logEvent('info', 'Fetching WABA details', { wabaId });
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/${wabaId}?` +
    `fields=name,account_review_status,business_verification_status&` +
    `access_token=${token}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'WABA details fetch failed', { wabaId, status: response.status, error: errorText });
    throw new Error(`Failed to fetch WABA details: ${response.status} - ${errorText}`);
  }

  const wabaDetails = await response.json();
  logEvent('info', 'WABA details fetched', { wabaId, name: wabaDetails.name });
  return wabaDetails;
}

async function fetchPhoneNumbers(wabaId: string, token: string, config: ConfigurationVariables): Promise<WhatsAppPhoneNumber[]> {
  logEvent('info', 'Fetching phone numbers', { wabaId });
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/${wabaId}/phone_numbers?access_token=${token}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'Phone numbers fetch failed', { wabaId, status: response.status, error: errorText });
    throw new Error(`Failed to fetch phone numbers: ${response.status} - ${errorText}`);
  }

  const phoneNumbersData = await response.json();
  const phoneNumbers = phoneNumbersData.data || [];

  if (phoneNumbers.length === 0) {
    logEvent('error', 'No phone numbers found', { wabaId });
    throw new Error('No phone numbers found for this WhatsApp Business Account');
  }

  logEvent('info', 'Phone numbers fetched', { wabaId, count: phoneNumbers.length });
  return phoneNumbers;
}

async function registerPhoneNumber(phoneNumberId: string, token: string, config: ConfigurationVariables): Promise<boolean> {
  logEvent('info', 'Registering phone number', { phoneNumberId });
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/${phoneNumberId}/register`,
          {
            method: 'POST',
            headers: {
          'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp'
            })
          }
    );

    if (response.ok) {
      logEvent('info', 'Phone number registered successfully', { phoneNumberId });
      return true;
        } else {
      const errorText = await response.text();
      logEvent('warn', 'Phone number registration failed - might already be registered', { 
        phoneNumberId, 
        status: response.status, 
        error: errorText 
      });
      return false;
    }
  } catch (error) {
    logEvent('warn', 'Phone number registration error', { phoneNumberId, error: error.message });
    return false;
  }
}

async function configureWebhooks(wabaId: string, token: string, config: ConfigurationVariables): Promise<boolean> {
  logEvent('info', 'Configuring webhooks', { wabaId });
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/${wabaId}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
          'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
    );

    if (response.ok) {
      logEvent('info', 'Webhooks configured successfully', { wabaId });
      return true;
        } else {
      const errorText = await response.text();
      logEvent('error', 'Webhook configuration failed', { 
        wabaId, 
        status: response.status, 
        error: errorText 
      });
      return false;
    }
  } catch (error) {
    logEvent('error', 'Webhook configuration error', { wabaId, error: error.message });
    return false;
  }
}

async function saveToDatabase(userId: string, channelConfig: Record<string, unknown>, config: ConfigurationVariables): Promise<void> {
  logEvent('info', 'Saving configuration to database', { userId });
  
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

  try {
    // Start transaction-like operation
      const { data: existingChannel, error: checkError } = await supabase
        .from('communication_channels')
      .select('id, channel_config')
        .eq('user_id', userId)
        .eq('channel_type', 'whatsapp')
        .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

      let dbError;
      if (existingChannel) {
        // Update existing channel
      logEvent('info', 'Updating existing WhatsApp channel', { userId, channelId: existingChannel.id });
      
        const { error: updateError } = await supabase
          .from('communication_channels')
          .update({
            channel_config: channelConfig,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChannel.id);
      
        dbError = updateError;
      } else {
        // Create new channel
      logEvent('info', 'Creating new WhatsApp channel', { userId });
      
        const { error: insertError } = await supabase
          .from('communication_channels')
          .insert({
            user_id: userId,
            channel_type: 'whatsapp',
            channel_config: channelConfig,
            is_connected: true
          });
      
        dbError = insertError;
      }

      if (dbError) {
      logEvent('error', 'Database operation failed', { userId, error: dbError.message });
      throw new Error(`Database error: ${dbError.message}`);
    }

    logEvent('info', 'Configuration saved to database successfully', { userId });
  } catch (error) {
    logEvent('error', 'Database operation error', { userId, error: error.message });
    throw error;
  }
}

function createSuccessResponse(data: Record<string, unknown>, isCallback: boolean = false, config: ConfigurationVariables) {
  if (isCallback) {
    // OAuth callback - redirect to frontend
    const redirectUrl = `${config.frontendUrl}/dashboard?success=true&channel=whatsapp&business_name=${encodeURIComponent(String(data.businessName || ''))}&phone_number=${encodeURIComponent(String(data.phoneNumber || ''))}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...CORS_HEADERS
      }
    });
  }

  // API response
        return new Response(
          JSON.stringify({ 
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

function createErrorResponse(error: string, status: number = 400, debug?: Record<string, unknown>) {
  const response = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(debug && Deno.env.get('ENVIRONMENT') !== 'production' ? { debug } : {})
  };

      return new Response(
    JSON.stringify(response),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

// Main Handler
serve(async (req) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  // Validate configuration first, outside try-catch
  let config: ConfigurationVariables;
  try {
    config = validateConfiguration();
  } catch (configError) {
    return createErrorResponse('Configuration error: ' + configError.message, 500);
  }
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    // Rate limiting
    if (isRateLimited(clientIP)) {
      logEvent('warn', 'Rate limit exceeded', { clientIP });
      return createErrorResponse('Rate limit exceeded. Try again later.', 429);
    }
    
    logEvent('info', 'Request received', { 
      method: req.method, 
      clientIP,
      userAgent: req.headers.get('user-agent')?.slice(0, 100)
    });

    // Health check endpoint
    if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          service: 'whatsapp-embedded-signup',
          timestamp: new Date().toISOString(),
          environment: config.environment,
          retryConfig: WABA_RETRY_CONFIG
        }),
        { 
          status: 200, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and validate request data
    let code: string, state: string, userId: string;
    let isCallback = false;
    
    if (req.method === 'POST' && req.headers.get('content-type')?.includes('application/json')) {
      // API call from frontend
      const body = await req.json();
      code = sanitizeInput(body.code);
      state = sanitizeInput(body.state);
      userId = sanitizeInput(body.userId);
    } else if (req.method === 'GET') {
      // OAuth callback
      const url = new URL(req.url);
      code = sanitizeInput(url.searchParams.get('code'));
      state = sanitizeInput(url.searchParams.get('state'));
      isCallback = true;
      
      // Extract userId from state
      if (state) {
        const stateData = validateStateParameter(state);
        userId = stateData.user_id;
      }
    } else {
      return createErrorResponse('Invalid request method or content type', 405);
    }

    // Validate required parameters
    if (!code) {
      return createErrorResponse('Missing authorization code', 400);
    }
    
    if (!userId) {
      return createErrorResponse('Missing or invalid user ID', 400);
    }

    // Main processing flow
    logEvent('info', 'Starting WhatsApp embedded signup flow', { userId, isCallback });

    // Step 1: Exchange code for token
    const businessIntegrationToken = await exchangeCodeForToken(code, config);

    // Step 2: Get WhatsApp Business Accounts (with retry mechanism)
    const wabas = await fetchWhatsAppBusinessAccounts(businessIntegrationToken, config);
    const selectedWaba = wabas[0]; // Use first WABA

    // Step 3: Get WABA details
    const wabaDetails = await fetchWABADetails(selectedWaba.id, businessIntegrationToken, config);

    // Step 4: Get phone numbers
    const phoneNumbers = await fetchPhoneNumbers(selectedWaba.id, businessIntegrationToken, config);
    const selectedPhoneNumber = phoneNumbers[0]; // Use first phone number

    // Step 5: Register phone number
    const phoneRegistered = await registerPhoneNumber(selectedPhoneNumber.id, businessIntegrationToken, config);

    // Step 6: Configure webhooks
    const webhookConfigured = await configureWebhooks(selectedWaba.id, businessIntegrationToken, config);

    // Step 7: Prepare channel configuration
    const channelConfig = {
      phone_number_id: selectedPhoneNumber.id,
      business_account_id: selectedWaba.id,
      access_token: businessIntegrationToken,
      display_phone_number: selectedPhoneNumber.display_phone_number,
      verified_name: selectedPhoneNumber.verified_name,
      business_name: wabaDetails.name,
      account_review_status: wabaDetails.account_review_status,
      business_verification_status: wabaDetails.business_verification_status,
      webhook_configured: webhookConfigured,
      webhook_url: config.webhookUrl,
      phone_registered: phoneRegistered,
      connected_at: new Date().toISOString(),
      last_health_check: new Date().toISOString()
    };

    // Step 8: Save to database
    await saveToDatabase(userId, channelConfig, config);

    // Step 9: Prepare response data
    const responseData = {
      businessName: wabaDetails.name,
      phoneNumber: selectedPhoneNumber.display_phone_number,
      wabaId: selectedWaba.id,
      phoneNumberId: selectedPhoneNumber.id,
      verifiedName: selectedPhoneNumber.verified_name,
      status: 'connected',
      webhookConfigured,
      phoneRegistered,
      accountReviewStatus: wabaDetails.account_review_status,
      businessVerificationStatus: wabaDetails.business_verification_status
    };

    const processingTime = Date.now() - startTime;
    logEvent('info', 'WhatsApp embedded signup completed successfully', { 
      userId, 
      processingTime,
      businessName: wabaDetails.name,
      phoneNumber: selectedPhoneNumber.display_phone_number
    });

    return createSuccessResponse(responseData, isCallback, config);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logEvent('error', 'Critical error in WhatsApp embedded signup', { 
      clientIP,
      processingTime,
      error: error.message,
      stack: error.stack
    });

    return createErrorResponse(
      error.message.includes('fetch') || error.message.includes('timeout') ? 'Service temporarily unavailable' : error.message,
      500,
      config?.environment === 'development' ? { stack: error.stack } : undefined
    );
  }
});