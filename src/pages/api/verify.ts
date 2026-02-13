import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, getEnv } from '@/lib/api-helpers';

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  try {
    let token: string | null = null;

    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      token = auth.slice(7);
    }

    // Fallback: try body
    if (!token) {
      const body = await request.json().catch(() => ({})) as { token?: string };
      token = body.token || null;
    }

    if (!token) {
      return jsonResponse({ valid: false });
    }

    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return jsonResponse({ valid: false });
    }

    try {
      const decoded = atob(token);
      const expectedSuffix = ':' + adminPassword.slice(0, 8);
      if (!decoded.endsWith(expectedSuffix)) {
        return jsonResponse({ valid: false });
      }

      const jsonPart = decoded.slice(0, decoded.length - expectedSuffix.length);
      const tokenData = JSON.parse(jsonPart);

      if (tokenData.exp && tokenData.exp > Date.now() && tokenData.admin === true) {
        return jsonResponse({ valid: true, expiresAt: tokenData.exp });
      }
    } catch {
      // Token parsing failed
    }

    return jsonResponse({ valid: false });
  } catch {
    return jsonResponse({ valid: false });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
