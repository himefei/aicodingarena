/**
 * Cloudflare Pages Function - Tabs API
 * CRUD for demo tab categories
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

// GET /api/tabs
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const result = await env.ARENA_DB.prepare(
      'SELECT * FROM tabs ORDER BY sort_order ASC, created_at ASC'
    ).all();
    return new Response(JSON.stringify(result.results), { headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tabs' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

// POST /api/tabs
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json() as {
      name_cn: string; name_en: string; slug: string; sort_order?: number;
    };

    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await env.ARENA_DB.prepare(
      'INSERT INTO tabs (id, name_cn, name_en, slug, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.name_cn, body.name_en, body.slug, body.sort_order || 0).run();

    const tab = await env.ARENA_DB.prepare('SELECT * FROM tabs WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify(tab), { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create tab' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
