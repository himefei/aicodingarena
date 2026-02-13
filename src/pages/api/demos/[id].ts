import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const id = context.params.id!;

  try {
    const demo = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    if (!demo) {
      return errorResponse('Demo not found', 404);
    }
    return jsonResponse(demo);
  } catch {
    return errorResponse('Failed to fetch demo');
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
    const demo = await env.ARENA_DB.prepare(
      'SELECT file_r2_key, thumbnail_r2_key FROM demos WHERE id = ?'
    ).bind(id).first<{ file_r2_key: string; thumbnail_r2_key: string | null }>();

    if (!demo) {
      return errorResponse('Demo not found', 404);
    }

    await env.ARENA_FILES.delete(demo.file_r2_key);
    if (demo.thumbnail_r2_key) {
      await env.ARENA_FILES.delete(demo.thumbnail_r2_key);
    }

    await env.ARENA_DB.prepare('DELETE FROM demos WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  } catch {
    return errorResponse('Failed to delete demo');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
