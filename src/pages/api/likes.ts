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

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const url = new URL(context.request.url);
  const tabId = url.searchParams.get('tab');
  const ip = getClientIP(context.request);

  try {
    // Get all like counts grouped by demo_id
    let countQuery: string;
    let countBindings: string[];

    if (tabId) {
      countQuery = `
        SELECT dl.demo_id, COUNT(*) as count
        FROM demo_likes dl
        JOIN demos d ON dl.demo_id = d.id
        WHERE d.tab_id = ?
        GROUP BY dl.demo_id
      `;
      countBindings = [tabId];
    } else {
      countQuery = `
        SELECT demo_id, COUNT(*) as count
        FROM demo_likes
        GROUP BY demo_id
      `;
      countBindings = [];
    }

    const counts = countBindings.length > 0
      ? await env.ARENA_DB.prepare(countQuery).bind(...countBindings).all<{ demo_id: string; count: number }>()
      : await env.ARENA_DB.prepare(countQuery).all<{ demo_id: string; count: number }>();

    // Get all demos liked by this IP
    let likedQuery: string;
    let likedBindings: string[];

    if (tabId) {
      likedQuery = `
        SELECT dl.demo_id
        FROM demo_likes dl
        JOIN demos d ON dl.demo_id = d.id
        WHERE dl.ip = ? AND d.tab_id = ?
      `;
      likedBindings = [ip, tabId];
    } else {
      likedQuery = `
        SELECT demo_id FROM demo_likes WHERE ip = ?
      `;
      likedBindings = [ip];
    }

    const likedResults = await env.ARENA_DB.prepare(likedQuery).bind(...likedBindings).all<{ demo_id: string }>();

    const likedSet = new Set((likedResults.results || []).map((r: { demo_id: string }) => r.demo_id));

    // Build response map
    const result: Record<string, { count: number; liked: boolean }> = {};
    for (const row of (counts.results || [])) {
      result[row.demo_id] = {
        count: row.count,
        liked: likedSet.has(row.demo_id),
      };
    }

    // Also include demos the user liked but might have 0 in counts (edge case)
    for (const demoId of likedSet) {
      if (!result[demoId as string]) {
        result[demoId as string] = { count: 1, liked: true };
      }
    }

    return jsonResponse(result);
  } catch {
    return errorResponse('Failed to fetch likes');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
