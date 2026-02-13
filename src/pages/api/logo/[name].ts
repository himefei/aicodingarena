import type { APIRoute } from 'astro';
import { getEnv } from '@/lib/api-helpers';

/** Serve SVG logos from R2 with caching */
export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const name = context.params.name;

  try {
    const object = await env.ARENA_FILES.get(`logos/${name}`);
    if (!object) {
      return new Response('Logo not found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=604800, immutable',
        'ETag': object.httpEtag,
      },
    });
  } catch {
    return new Response('Failed to serve logo', { status: 500 });
  }
};
