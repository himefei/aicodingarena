import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  try {
    const result = await env.ARENA_DB.prepare(
      'SELECT * FROM models_registry ORDER BY name ASC'
    ).all();
    return jsonResponse(result.results);
  } catch {
    return errorResponse('Failed to fetch models');
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
      key: string; name: string; logo_filename: string; color: string;
    };

    await env.ARENA_DB.prepare(
      'INSERT OR REPLACE INTO models_registry (key, name, logo_filename, color) VALUES (?, ?, ?, ?)'
    ).bind(body.key, body.name, body.logo_filename, body.color).run();

    return jsonResponse(body, 201);
  } catch {
    return errorResponse('Failed to create model');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
