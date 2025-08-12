// Deno Edge Function: Meta (Facebook) Webhook
// - GET: verification (hub.challenge)
// - POST: events (messages, messaging_postbacks)

const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function isValidSignature(request: Request, rawBody: string): Promise<boolean> {
  const signatureHeader = request.headers.get("X-Hub-Signature-256");
  if (!signatureHeader || !META_APP_SECRET) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = `sha256=${toHex(digest)}`;
  return safeEqual(expected, signatureHeader);
}

export const handler = async (request: Request): Promise<Response> => {
  const { method } = request;

  if (method === "GET") {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && verifyToken === META_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (method === "POST") {
    const rawBody = await request.text();

    // Verify signature
    const valid = await isValidSignature(request, rawBody);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }

    try {
      const body = JSON.parse(rawBody);
      // Basic normalization skeleton
      if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const messagingEvents = entry.messaging ?? [];
          for (const evt of messagingEvents) {
            const senderId = evt.sender?.id;
            const pageId = evt.recipient?.id;
            const text = evt.message?.text ?? evt.postback?.title ?? "";
            // TODO: Insert conversation/message into your DB using Supabase Service Role client
            console.log("Incoming message", { pageId, senderId, text });
          }
        }
      }
      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (e) {
      console.error("Webhook error", e);
      return new Response("Bad Request", { status: 400 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};

// Deno deploy-style export
export default handler;

