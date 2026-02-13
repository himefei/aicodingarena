/**
 * Cloudflare Pages Function - Serve files from R2
 * Serves HTML demos and thumbnails from R2 storage
 * Route: /api/file/[...path]
 */

import type { Env } from '../../src/lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  // params.path can be a string or array for catch-all routes
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const filePath = pathParts.join('/');

  try {
    const object = await env.ARENA_FILES.get(filePath);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Allow iframe embedding from same origin
    headers.set('X-Frame-Options', 'SAMEORIGIN');

    // For HTML files, set proper content type and sandbox-friendly headers
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      headers.set('Content-Type', 'text/html; charset=utf-8');
    }

    return new Response(object.body, { headers });
  } catch {
    return new Response('Failed to fetch file', { status: 500 });
  }
};
