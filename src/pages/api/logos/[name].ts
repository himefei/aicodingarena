import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

/** Delete an SVG logo from R2 */
export const DELETE: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const name = context.params.name;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    await env.ARENA_FILES.delete(`logos/${name}`);
    return jsonResponse({ deleted: name });
  } catch {
    return errorResponse('Failed to delete logo');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
