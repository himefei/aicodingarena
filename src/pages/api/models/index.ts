import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  try {
    const result = await env.ARENA_DB.prepare(
      `SELECT m.key, m.name, m.brand_key,
              COALESCE(b.name, m.name) as brand_name,
              COALESCE(b.logo_filename, m.logo_filename, 'default.svg') as logo_filename,
              m.color
       FROM models_registry m
       LEFT JOIN model_brands b ON m.brand_key = b.key
       ORDER BY COALESCE(b.name, m.name) ASC, m.name ASC`
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
      brand_key: string;
      name: string;
    };

    if (!body.brand_key || !body.name) {
      return errorResponse('Missing brand_key or name', 400);
    }

    // Auto-generate unique key from brand + name
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const key = `${body.brand_key}-${slug}-${Date.now().toString(36).slice(-4)}`;

    // Get brand info for logo_filename (backward compat column)
    const brand = await env.ARENA_DB.prepare(
      'SELECT name, logo_filename FROM model_brands WHERE key = ?'
    ).bind(body.brand_key).first<{ name: string; logo_filename: string }>();

    if (!brand) {
      return errorResponse('Brand not found', 404);
    }

    await env.ARENA_DB.prepare(
      'INSERT INTO models_registry (key, name, brand_key, logo_filename, color) VALUES (?, ?, ?, ?, ?)'
    ).bind(key, body.name, body.brand_key, brand.logo_filename, '#6366f1').run();

    const model = await env.ARENA_DB.prepare(
      `SELECT m.key, m.name, m.brand_key,
              b.name as brand_name,
              b.logo_filename,
              m.color
       FROM models_registry m
       LEFT JOIN model_brands b ON m.brand_key = b.key
       WHERE m.key = ?`
    ).bind(key).first();

    return jsonResponse(model, 201);
  } catch {
    return errorResponse('Failed to create model');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
