import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  try {
    const result = await env.ARENA_DB.prepare(
      'SELECT * FROM tabs ORDER BY sort_order ASC, created_at ASC'
    ).all();
    return jsonResponse(result.results);
  } catch {
    return errorResponse('Failed to fetch tabs');
  }
};

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
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
    return jsonResponse(tab, 201);
  } catch {
    return errorResponse('Failed to create tab');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
