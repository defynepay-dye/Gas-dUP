// Edge Function: create-location-jwt
// Template to issue short-lived JWT tokens for location operations.
// - Validates required environment variables at startup (fail fast)
// - Replaces hardcoded secrets with env variables
// - Minimal example JWT issuance (illustrative only)
//
// Required environment variables:
//   JWT_SECRET
//   JWT_ISSUER (optional)
//   JWT_EXPIRATION_SECONDS (optional, default: 3600)

console.info('create-location-jwt function starting');

type EnvSpec = { name: string };

function validateEnv(specs: EnvSpec[]) {
  const missing = specs.filter((s) => !Deno.env.get(s.name)).map((s) => s.name);
  if (missing.length) {
    console.error('Missing environment variables: ' + missing.join(', '));
    throw new Error('Missing environment variables: ' + missing.join(', '));
  }
}

try {
  validateEnv([{ name: 'JWT_SECRET' }]);
} catch (err) {
  console.error('Environment validation failed:', err instanceof Error ? err.message : err);
  throw err;
}

// Minimal JWT helper using Web Crypto — this is illustrative and simple.
// For production, use a vetted library for token creation / verification.
async function signToken(payload: Record<string, unknown>, expiresInSec: number): Promise<string> {
  const secret = Deno.env.get('JWT_SECRET')!;
  // Use HMAC-SHA256
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const iss = Deno.env.get('JWT_ISSUER') || 'create-location-jwt';
  const body = { ...payload, iat: now, exp: now + expiresInSec, iss };

  const encode = (obj: unknown) => {
    const s = JSON.stringify(obj);
    // base64url
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const toSign = encode(header) + '.' + encode(body);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return toSign + '.' + sigBase64;
}

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handler(event.request));
});

async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/create-location-jwt') {
      if (req.headers.get('content-type') !== 'application/json') {
        return new Response(JSON.stringify({ error: 'invalid_content_type' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }

      const payload = await req.json();
      // Basic payload check: ensure there's a subject or location id
      if (!payload || !(payload.sub || payload.location_id)) {
        return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }

      const expires = Number(Deno.env.get('JWT_EXPIRATION_SECONDS') || '3600');
      // TODO: add scopes/claims validation and other business logic as needed
      const token = await signToken(payload as Record<string, unknown>, expires);

      return new Response(JSON.stringify({ token, expires_in: expires }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/create-location-jwt/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

// Notes:
// - This JWT implementation is minimal and illustrative. For production, use well-tested libs.
// - Keep JWT_SECRET secret and set it via Supabase Edge Function environment settings.
// - Expand token claims and verification flows as required by your application.