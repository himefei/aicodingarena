import type { APIRoute } from 'astro';
import { getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const filePath = context.params.path!;

  try {
    const object = await env.ARENA_FILES.get(filePath);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('X-Frame-Options', 'SAMEORIGIN');

    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      headers.set('Content-Type', 'text/html; charset=utf-8');
    }

    return new Response(object.body, { headers });
  } catch {
    return new Response('Failed to fetch file', { status: 500 });
  }
};
