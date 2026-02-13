import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

/** List or create model brands */
export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  try {
    const result = await env.ARENA_DB.prepare(
      'SELECT * FROM model_brands ORDER BY name ASC'
    ).all();
    return jsonResponse(result.results);
  } catch {
    return errorResponse('Failed to fetch brands');
  }
};

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as {
      key: string;
      name: string;
      logo_filename: string;
    };

    if (!body.key || !body.name || !body.logo_filename) {
      return errorResponse('Missing key, name, or logo_filename', 400);
    }

    // Check uniqueness
    const existing = await env.ARENA_DB.prepare(
      'SELECT key FROM model_brands WHERE key = ?'
    ).bind(body.key).first();
    if (existing) {
      return errorResponse('Brand key already exists', 409);
    }

    await env.ARENA_DB.prepare(
      'INSERT INTO model_brands (key, name, logo_filename) VALUES (?, ?, ?)'
    ).bind(body.key, body.name, body.logo_filename).run();

    return jsonResponse(body, 201);
  } catch {
    return errorResponse('Failed to create brand');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
