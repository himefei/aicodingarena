/**
 * Cloudflare Pages Function - Verify Token API
 * Validates that a session token is still valid
 */

import type { Env } from '../../src/lib/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    let token = extractToken(request);

    // Fallback: try body
    if (!token) {
      const body = await request.json().catch(() => ({})) as { token?: string };
      token = body.token || null;
    }

    if (!token) {
      return new Response(JSON.stringify({ valid: false }), { status: 200, headers: CORS_HEADERS });
    }

    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(JSON.stringify({ valid: false }), { status: 200, headers: CORS_HEADERS });
    }

    try {
      const decoded = atob(token);
      const expectedSuffix = ':' + adminPassword.slice(0, 8);
      if (!decoded.endsWith(expectedSuffix)) {
        return new Response(JSON.stringify({ valid: false }), { status: 200, headers: CORS_HEADERS });
      }

      const jsonPart = decoded.slice(0, decoded.length - expectedSuffix.length);
      const tokenData = JSON.parse(jsonPart);

      if (tokenData.exp && tokenData.exp > Date.now() && tokenData.admin === true) {
        return new Response(
          JSON.stringify({ valid: true, expiresAt: tokenData.exp }),
          { status: 200, headers: CORS_HEADERS }
        );
      }
    } catch {
      // Token parsing failed
    }

    return new Response(JSON.stringify({ valid: false }), { status: 200, headers: CORS_HEADERS });
  } catch {
    return new Response(JSON.stringify({ valid: false }), { status: 200, headers: CORS_HEADERS });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
