import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, getEnv } from '@/lib/api-helpers';

function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    '0.0.0.0'
  );
}

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const demoId = context.params.id!;
  const ip = getClientIP(context.request);

  try {
    // Check if demo exists
    const demo = await env.ARENA_DB.prepare('SELECT id FROM demos WHERE id = ?').bind(demoId).first();
    if (!demo) {
      return errorResponse('Demo not found', 404);
    }

    // Check if already liked
    const existing = await env.ARENA_DB.prepare(
      'SELECT id FROM demo_likes WHERE demo_id = ? AND ip = ?'
    ).bind(demoId, ip).first();

    if (existing) {
      // Unlike
      await env.ARENA_DB.prepare(
        'DELETE FROM demo_likes WHERE demo_id = ? AND ip = ?'
      ).bind(demoId, ip).run();
    } else {
      // Like
      await env.ARENA_DB.prepare(
        'INSERT INTO demo_likes (demo_id, ip) VALUES (?, ?)'
      ).bind(demoId, ip).run();
    }

    // Get updated count
    const countResult = await env.ARENA_DB.prepare(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?'
    ).bind(demoId).first<{ count: number }>();

    return jsonResponse({
      liked: !existing,
      count: countResult?.count || 0,
    });
  } catch {
    return errorResponse('Failed to toggle like');
  }
};

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const demoId = context.params.id!;
  const ip = getClientIP(context.request);

  try {
    const countResult = await env.ARENA_DB.prepare(
      'SELECT COUNT(*) as count FROM demo_likes WHERE demo_id = ?'
    ).bind(demoId).first<{ count: number }>();

    const liked = await env.ARENA_DB.prepare(
      'SELECT id FROM demo_likes WHERE demo_id = ? AND ip = ?'
    ).bind(demoId, ip).first();

    return jsonResponse({
      count: countResult?.count || 0,
      liked: !!liked,
    });
  } catch {
    return errorResponse('Failed to get like info');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
