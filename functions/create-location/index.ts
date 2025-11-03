// Edge Function: create-location
// Deno + Supabase best-practices template
// - Validates required environment variables at startup (fail fast)
// - Replaces hardcoded secrets with environment variables
// - Minimal example business logic, with markers for custom logic
//
// Required environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (if you need server-side elevated access)
//   LOCATION_DB_TABLE           (optional helper config)

console.info('create-location function starting');

type EnvSpec = { name: string };

function validateEnv(specs: EnvSpec[]) {
  const missing = specs.filter((s) => !Deno.env.get(s.name)).map((s) => s.name);
  if (missing.length) {
    console.error('Missing environment variables: ' + missing.join(', '));
    throw new Error('Missing environment variables: ' + missing.join(', '));
  }
}

try {
  validateEnv([
    { name: 'SUPABASE_URL' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY' },
  ]);
} catch (err) {
  console.error('Environment validation failed:', err instanceof Error ? err.message : err);
  throw err;
}

// Example: minimal create-location handler
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handler(event.request));
});

async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/create-location') {
      // Enforce JSON
      if (req.headers.get('content-type') !== 'application/json') {
        return new Response(JSON.stringify({ error: 'invalid_content_type' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      const payload = await req.json();
      // Basic validation example — replace with your own validation schema
      if (!payload || typeof payload.name !== 'string') {
        return new Response(JSON.stringify({ error: 'invalid_payload' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      // TODO: Implement the create-location business logic here.
      // Example approaches:
      // - Use the Supabase JS client (Deno compatible) with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
      // - Insert into a locations table, trigger downstream jobs, etc.

      // Minimal example response (replace with real DB response)
      const created = {
        id: crypto.randomUUID(),
        name: payload.name,
        created_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ data: created }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/create-location/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
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
// - Avoid storing service_role_key in source. Configure it as an environment variable in Supabase.
// - Consider using typed validation (zod) for payload validation if desired.