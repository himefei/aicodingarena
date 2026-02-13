/**
 * Cloudflare Pages Function - Models Registry API
 */

import type { Env } from '../../src/lib/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyToken(request: Request, adminPassword: string): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = atob(token);
    const expectedSuffix = ':' + adminPassword.slice(0, 8);
    if (!decoded.endsWith(expectedSuffix)) return false;
    const jsonPart = decoded.slice(0, decoded.length - expectedSuffix.length);
    const tokenData = JSON.parse(jsonPart);
    return tokenData.exp > Date.now() && tokenData.admin === true;
  } catch {
    return false;
  }
}

// GET /api/models
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const result = await env.ARENA_DB.prepare(
      'SELECT * FROM models_registry ORDER BY name ASC'
    ).all();
    return new Response(JSON.stringify(result.results), { headers: CORS_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

// POST /api/models
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json() as {
      key: string; name: string; logo_filename: string; color: string;
    };

    await env.ARENA_DB.prepare(
      'INSERT OR REPLACE INTO models_registry (key, name, logo_filename, color) VALUES (?, ?, ?, ?)'
    ).bind(body.key, body.name, body.logo_filename, body.color).run();

    return new Response(JSON.stringify(body), { status: 201, headers: CORS_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to create model' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
