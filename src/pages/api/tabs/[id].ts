import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const PUT: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const id = context.params.id!;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
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
      return errorResponse('No fields to update', 400);
    }

    values.push(id);
    await env.ARENA_DB.prepare(
      `UPDATE tabs SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const tab = await env.ARENA_DB.prepare('SELECT * FROM tabs WHERE id = ?').bind(id).first();
    return jsonResponse(tab);
  } catch {
    return errorResponse('Failed to update tab');
  }
};

export const DELETE: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const id = context.params.id!;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
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

    return jsonResponse({ success: true });
  } catch {
    return errorResponse('Failed to delete tab');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
