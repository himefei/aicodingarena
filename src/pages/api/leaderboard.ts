import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const url = new URL(context.request.url);
  const tabId = url.searchParams.get('tab');

  try {
    let query: string;
    let bindings: string[];

    if (tabId) {
      query = `
        SELECT
          d.id as demo_id,
          d.model_name,
          d.model_key,
          d.tab_id,
          mb.name as brand_name,
          mr.color,
          COUNT(dl.id) as like_count
        FROM demos d
        LEFT JOIN demo_likes dl ON d.id = dl.demo_id
        LEFT JOIN models_registry mr ON d.model_key = mr.key
        LEFT JOIN model_brands mb ON mr.brand_key = mb.key
        WHERE d.tab_id = ?
        GROUP BY d.id
        HAVING like_count > 0
        ORDER BY like_count DESC
      `;
      bindings = [tabId];
    } else {
      query = `
        SELECT
          d.id as demo_id,
          d.model_name,
          d.model_key,
          d.tab_id,
          mb.name as brand_name,
          mr.color,
          COUNT(dl.id) as like_count
        FROM demos d
        LEFT JOIN demo_likes dl ON d.id = dl.demo_id
        LEFT JOIN models_registry mr ON d.model_key = mr.key
        LEFT JOIN model_brands mb ON mr.brand_key = mb.key
        GROUP BY d.id
        HAVING like_count > 0
        ORDER BY like_count DESC
      `;
      bindings = [];
    }

    const result = bindings.length > 0
      ? await env.ARENA_DB.prepare(query).bind(...bindings).all()
      : await env.ARENA_DB.prepare(query).all();

    return jsonResponse(result.results || []);
  } catch {
    return errorResponse('Failed to fetch leaderboard');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
