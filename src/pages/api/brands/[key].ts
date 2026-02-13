import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

/** Delete a model brand */
export const DELETE: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const key = context.params.key;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    // Check if any models still reference this brand
    const modelCount = await env.ARENA_DB.prepare(
      'SELECT COUNT(*) as cnt FROM models_registry WHERE brand_key = ?'
    ).bind(key).first<{ cnt: number }>();

    if (modelCount && modelCount.cnt > 0) {
      return errorResponse(`Cannot delete brand: ${modelCount.cnt} model(s) still reference it`, 409);
    }

    await env.ARENA_DB.prepare('DELETE FROM model_brands WHERE key = ?').bind(key).run();
    return jsonResponse({ deleted: key });
  } catch {
    return errorResponse('Failed to delete brand');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
