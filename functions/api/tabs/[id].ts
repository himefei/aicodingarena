/**
 * Cloudflare Pages Function - Tab by ID (PUT, DELETE)
 */

import type { Env } from '../../../src/lib/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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

// PUT /api/tabs/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json() as {
      name_cn?: string; name_en?: string; slug?: string; sort_order?: number;
    };

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name_cn !== undefined) { updates.push('name_cn = ?'); values.push(body.name_cn); }
    if (body.name_en !== undefined) { updates.push('name_en = ?'); values.push(body.name_en); }
    if (body.slug !== undefined) { updates.push('slug = ?'); values.push(body.slug); }
    if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    values.push(id);
    await env.ARENA_DB.prepare(
      `UPDATE tabs SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const tab = await env.ARENA_DB.prepare('SELECT * FROM tabs WHERE id = ?').bind(id).first();
    return new Response(JSON.stringify(tab), { headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update tab' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

// DELETE /api/tabs/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    // Delete associated demos first
    const demos = await env.ARENA_DB.prepare(
      'SELECT file_r2_key, thumbnail_r2_key FROM demos WHERE tab_id = ?'
    ).bind(id).all();

    for (const demo of demos.results) {
      const d = demo as { file_r2_key: string; thumbnail_r2_key: string | null };
      await env.ARENA_FILES.delete(d.file_r2_key);
      if (d.thumbnail_r2_key) await env.ARENA_FILES.delete(d.thumbnail_r2_key);
    }

    await env.ARENA_DB.prepare('DELETE FROM demos WHERE tab_id = ?').bind(id).run();
    await env.ARENA_DB.prepare('DELETE FROM tabs WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete tab' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
