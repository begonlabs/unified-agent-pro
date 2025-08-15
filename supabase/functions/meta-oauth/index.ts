// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Meta (Facebook) OAuth Redirect Handler
// Exchanges code -> user_access_token, fetches pages and page_access_tokens.
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const META_APP_ID = Deno.env.get("META_APP_ID") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";

async function fetchJSON(url: string) {
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  if (!res.ok) {
    let details: unknown = text;
    try {
      details = JSON.parse(text);
    } catch (_) {
      // ignore JSON parse error, keep raw text
    }
    throw new Error(`HTTP ${res.status}: ${typeof details === "string" ? details : JSON.stringify(details)}`);
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error(`Invalid JSON response`);
  }
}

export const handler = async (request: Request): Promise<Response> => {
  try {
    // Validate required env vars
    if (!META_APP_ID || !META_APP_SECRET || !META_GRAPH_VERSION) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required META_* env vars", env: {
          META_APP_ID: Boolean(META_APP_ID),
          META_APP_SECRET: Boolean(META_APP_SECRET),
          META_GRAPH_VERSION: Boolean(META_GRAPH_VERSION),
        }}),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    // Prefer explicit redirect URI to avoid proxy/port mismatches. Fallback to forwarded headers, then URL origin
    const explicitRedirect = Deno.env.get("META_REDIRECT_URI") ?? "";
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const publicOrigin = forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : url.origin;
    const redirectUri = explicitRedirect || `${publicOrigin}${url.pathname}`; // current function public URL

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    // Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?client_id=${encodeURIComponent(META_APP_ID)}&client_secret=${encodeURIComponent(META_APP_SECRET)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`;
    const tokenData = await fetchJSON(tokenUrl);
    if (!tokenData || typeof tokenData !== "object" || !("access_token" in tokenData)) {
      throw new Error("No access token received from Meta");
    }
    const userAccessToken = (tokenData as { access_token: string }).access_token as string;

    // Get pages for this user
    const accountsUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}`;
    const accountsData = await fetchJSON(accountsUrl);
    const pages = (accountsData.data ?? []) as Array<{ id: string; name: string; access_token: string }>; 

    // NOTE: In a full implementation you would:
    // - let the user pick a page on frontend or auto-select here
    // - subscribe the page to the webhook
    // - save page_id, page_name, page_access_token to your DB linked to the current user

    const minimal = pages.map((p) => ({ id: p.id, name: p.name }));
    return new Response(JSON.stringify({ ok: true, pages: minimal }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    // Include minimal debug context to verify redirect_uri and graph version used server-side
    let debug: Record<string, unknown> = {};
    try {
      const u = new URL(request.url);
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const publicOrigin = forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : u.origin;
      const explicitRedirect = Deno.env.get("META_REDIRECT_URI") ?? "";
      debug = {
        request_url: u.toString(),
        computed_redirect_uri: (explicitRedirect || `${publicOrigin}${u.pathname}`),
        graph_version: META_GRAPH_VERSION,
        app_id_present: Boolean(META_APP_ID),
      };
    } catch (_) {
      // ignore
    }
    return new Response(JSON.stringify({ ok: false, error: String(e), debug }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Register the request handler with the Edge runtime
serve(handler);

export default handler;