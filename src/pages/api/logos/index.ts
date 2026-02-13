import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

/** List available SVG logos from R2, or upload a new one */
export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  try {
    const listed = await env.ARENA_FILES.list({ prefix: 'logos/' });
    const logos = listed.objects
      .map((obj) => obj.key.replace('logos/', ''))
      .filter((name) => name.length > 0);
    return jsonResponse(logos);
  } catch {
    return errorResponse('Failed to list logos');
  }
};

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as { name: string; content: string };
    if (!body.name || !body.content) {
      return errorResponse('Missing name or content', 400);
    }

    // Sanitize filename: keep alphanumeric, dot, dash, underscore
    let safeName = body.name.trim().replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeName.endsWith('.svg')) safeName += '.svg';

    await env.ARENA_FILES.put(`logos/${safeName}`, body.content, {
      httpMetadata: { contentType: 'image/svg+xml' },
    });

    return jsonResponse({ name: safeName }, 201);
  } catch {
    return errorResponse('Failed to upload logo');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
