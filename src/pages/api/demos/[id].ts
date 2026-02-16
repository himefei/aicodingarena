import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, verifyToken, getEnv } from '@/lib/api-helpers';

export const GET: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const id = context.params.id!;

  try {
    const demo = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    if (!demo) {
      return errorResponse('Demo not found', 404);
    }
    return jsonResponse(demo);
  } catch {
    return errorResponse('Failed to fetch demo');
  }
};

export const PUT: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const id = context.params.id!;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const existing = await env.ARENA_DB.prepare(
      'SELECT * FROM demos WHERE id = ?'
    ).bind(id).first<{ file_r2_key: string; thumbnail_r2_key: string | null }>();

    if (!existing) {
      return errorResponse('Demo not found', 404);
    }

    const body = await request.json() as {
      tab_id?: string;
      model_key?: string;
      model_name?: string;
      demo_type?: 'html' | 'python' | 'markdown';
      code?: string;
      comment?: string;
    };

    // If new code is provided, re-upload the file to R2
    if (body.code) {
      const { wrapPythonAsHtml, wrapMarkdownAsHtml } = await import('./index');
      const demoType = body.demo_type || 'html';
      let htmlContent: string;
      if (demoType === 'python') {
        htmlContent = wrapPythonAsHtml(body.code);
      } else if (demoType === 'markdown') {
        htmlContent = wrapMarkdownAsHtml(body.code);
      } else {
        htmlContent = body.code;
      }
      await env.ARENA_FILES.put(existing.file_r2_key, htmlContent, {
        httpMetadata: { contentType: 'text/html' },
      });
    }

    // Update DB fields
    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.tab_id) { updates.push('tab_id = ?'); values.push(body.tab_id); }
    if (body.model_key) { updates.push('model_key = ?'); values.push(body.model_key); }
    if (body.model_name) { updates.push('model_name = ?'); values.push(body.model_name); }
    if (body.demo_type) { updates.push('demo_type = ?'); values.push(body.demo_type); }
    if (body.comment !== undefined) { updates.push('comment = ?'); values.push(body.comment || null); }

    if (updates.length > 0) {
      values.push(id);
      await env.ARENA_DB.prepare(
        `UPDATE demos SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values).run();
    }

    const updated = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    return jsonResponse(updated);
  } catch (e) {
    return errorResponse('Failed to update demo');
  }
};

export const DELETE: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;
  const id = context.params.id!;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const demo = await env.ARENA_DB.prepare(
      'SELECT file_r2_key, thumbnail_r2_key FROM demos WHERE id = ?'
    ).bind(id).first<{ file_r2_key: string; thumbnail_r2_key: string | null }>();

    if (!demo) {
      return errorResponse('Demo not found', 404);
    }

    await env.ARENA_FILES.delete(demo.file_r2_key);
    if (demo.thumbnail_r2_key) {
      await env.ARENA_FILES.delete(demo.thumbnail_r2_key);
    }

    await env.ARENA_DB.prepare('DELETE FROM demos WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  } catch {
    return errorResponse('Failed to delete demo');
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
