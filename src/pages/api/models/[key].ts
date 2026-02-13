import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const DELETE: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const key = context.params.key!;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    await env.ARENA_DB.prepare('DELETE FROM models_registry WHERE key = ?').bind(key).run();
    return jsonResponse({ success: true });
  } catch {
    return errorResponse('Failed to delete model');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
