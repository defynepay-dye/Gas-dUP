// Edge Function: node-api
// Deno + Supabase best-practices template
// - Validates required environment variables at startup (fail fast)
// - Replaces hardcoded secrets with environment variables
// - Minimal example business logic, with markers for custom logic
//
// Required environment variables:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   NODE_API_ADMIN_SECRET

console.info('node-api function starting');

type EnvSpec = { name: string };

function requiredEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) {
    console.error('Missing required environment variable: ' + name);
    throw new Error('Missing required environment variable: ' + name);
  }
  return v;
}

function validateEnv(specs: EnvSpec[]) {
  const missing = specs.filter((s) => !Deno.env.get(s.name)).map((s) => s.name);
  if (missing.length) {
    console.error('Missing environment variables: ' + missing.join(', '));
    throw new Error('Missing environment variables: ' + missing.join(', '));
  }
}

// Validate at startup (fail fast)
try {
  validateEnv([
    { name: 'SUPABASE_URL' },
    { name: 'SUPABASE_ANON_KEY' },
    { name: 'NODE_API_ADMIN_SECRET' },
  ]);
} catch (err) {
  // Failing the module during cold start ensures we don't run with misconfiguration.
  console.error('Environment validation failed:', err instanceof Error ? err.message : err);
  throw err;
}

// Example: small helper to check admin secret from header
function isAdminRequest(req: Request): boolean {
  const header = req.headers.get('x-admin-secret');
  const adminSecret = Deno.env.get('NODE_API_ADMIN_SECRET')!;
  return header === adminSecret;
}

// Minimal Deno serve handler
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handler(event.request));
});

async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    // Health check
    if (req.method === 'GET' && url.pathname === '/node-api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Example protected admin endpoint
    if (req.method === 'GET' && url.pathname === '/node-api/admin') {
      if (!isAdminRequest(req)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        });
      }
      // TODO: Replace this with your admin logic (query DB, perform action, etc.)
      return new Response(JSON.stringify({ message: 'admin ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Default placeholder route — replace this with your API logic.
    if (req.method === 'POST' && url.pathname === '/node-api/echo') {
      const body = await req.text();
      // Minimal example transformation
      return new Response(JSON.stringify({ echoed: body }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('handler error:', err);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// Notes:
// - Keep secret values out of source. Use Deno environment variables (set in Supabase UI).
// - For DB or Supabase client usage, import the official client and initialize using SUPABASE_URL and SUPABASE_ANON_KEY.
// - Marked TODOs are where to implement business logic.
