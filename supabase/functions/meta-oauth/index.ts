// Deno Edge Function: Meta (Facebook) OAuth Redirect Handler
// Exchanges code -> user_access_token, fetches pages and page_access_tokens.

const META_APP_ID = Deno.env.get("META_APP_ID") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v19.0";

async function fetchJSON(url: string) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }             
  return res.json();
}

export const handler = async (request: Request): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const redirectUri = `${url.origin}${url.pathname}`; // current function URL

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    // Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?client_id=${encodeURIComponent(META_APP_ID)}&client_secret=${encodeURIComponent(META_APP_SECRET)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`;
    const tokenData = await fetchJSON(tokenUrl);
    const userAccessToken = tokenData.access_token as string;

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
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export default handler;

