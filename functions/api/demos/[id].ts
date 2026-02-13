/**
 * Cloudflare Pages Function - Demo by ID (DELETE)
 */

import type { Env } from '../../../src/lib/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
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

// GET /api/demos/:id — return demo metadata
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = params.id as string;

  try {
    const demo = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    if (!demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: CORS_HEADERS,
      });
    }
    return new Response(JSON.stringify(demo), { headers: CORS_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch demo' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

// DELETE /api/demos/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    const demo = await env.ARENA_DB.prepare(
      'SELECT file_r2_key, thumbnail_r2_key FROM demos WHERE id = ?'
    ).bind(id).first<{ file_r2_key: string; thumbnail_r2_key: string | null }>();

    if (!demo) {
      return new Response(JSON.stringify({ error: 'Demo not found' }), {
        status: 404, headers: CORS_HEADERS,
      });
    }

    // Delete files from R2
    await env.ARENA_FILES.delete(demo.file_r2_key);
    if (demo.thumbnail_r2_key) {
      await env.ARENA_FILES.delete(demo.thumbnail_r2_key);
    }

    // Delete from D1
    await env.ARENA_DB.prepare('DELETE FROM demos WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to delete demo' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
