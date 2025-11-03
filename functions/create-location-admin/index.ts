// Edge Function: create-location-admin
// Admin-level operations for locations, protected by an admin secret.
// Deno + Supabase best-practices template:
// - Validates required environment variables at startup
// - Uses env var for admin secret (no hardcoded secrets)
// - Minimal admin example logic with markers for custom logic
//
// Required environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   LOCATION_ADMIN_SECRET

console.info('create-location-admin function starting');

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
    { name: 'LOCATION_ADMIN_SECRET' },
  ]);
} catch (err) {
  console.error('Environment validation failed:', err instanceof Error ? err.message : err);
  throw err;
}

function isAdmin(req: Request): boolean {
  const header = req.headers.get('x-location-admin-secret');
  const secret = Deno.env.get('LOCATION_ADMIN_SECRET')!;
  return header === secret;
}

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handler(event.request));
});

async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    if (!isAdmin(req)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Example admin endpoint: delete a location by id (placeholder)
    if (req.method === 'DELETE' && url.pathname.startsWith('/create-location-admin/location/')) {
      const parts = url.pathname.split('/');
      const id = parts[parts.length - 1];
      if (!id) {
        return new Response(JSON.stringify({ error: 'missing_id' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      // TODO: Replace with actual deletion logic using Supabase service role key or DB client.
      // Example: await supabase.from('locations').delete().eq('id', id);

      return new Response(JSON.stringify({ data: { id, deleted: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Example: list pending approvals (placeholder)
    if (req.method === 'GET' && url.pathname === '/create-location-admin/pending') {
      // TODO: Query DB for pending locations
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/create-location-admin/health') {
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
// - Admin secret must be configured in the Supabase Edge Function environment settings.
// - Use the SUPABASE_SERVICE_ROLE_KEY only where absolutely necessary on trusted environments.