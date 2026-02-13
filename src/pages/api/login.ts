import type { APIRoute } from 'astro';
import { CORS_HEADERS, jsonResponse, errorResponse, getEnv } from '@/lib/api-helpers';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const POST: APIRoute = async (context) => {
  const env = getEnv(context.locals);
  const { request } = context;

  const clientIP =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    'unknown';

  try {
    // Check if IP is locked out
    const attempt = await env.ARENA_DB.prepare(
      'SELECT count, locked_until FROM login_attempts WHERE ip = ?'
    ).bind(clientIP).first<{ count: number; locked_until: string | null }>();

    if (attempt?.locked_until) {
      const lockedUntil = new Date(attempt.locked_until).getTime();
      if (Date.now() < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 60000);
        return jsonResponse({
          success: false,
          message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
          locked: true,
          remainingMinutes,
        }, 429);
      } else {
        await env.ARENA_DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIP).run();
      }
    }

    const body = await request.json() as { password?: string };
    const { password } = body;

    if (!password) {
      return jsonResponse({ success: false, message: 'Password required' }, 400);
    }

    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return jsonResponse({ success: false, message: 'Server configuration error: ADMIN_PASSWORD not set' }, 500);
    }

    if (password === adminPassword) {
      await env.ARENA_DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIP).run();

      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      const tokenData = { admin: true, exp: expiry };
      const token = btoa(JSON.stringify(tokenData) + ':' + adminPassword.slice(0, 8));

      return jsonResponse({ success: true, token, expiresAt: expiry });
    } else {
      const currentCount = attempt?.count || 0;
      const newCount = currentCount + 1;

      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        await env.ARENA_DB.prepare(
          'INSERT OR REPLACE INTO login_attempts (ip, count, locked_until) VALUES (?, ?, ?)'
        ).bind(clientIP, newCount, lockedUntil).run();

        return jsonResponse({
          success: false,
          message: 'Too many failed attempts. Account locked for 1 hour.',
          locked: true,
          remainingMinutes: 60,
        }, 429);
      } else {
        await env.ARENA_DB.prepare(
          "INSERT OR REPLACE INTO login_attempts (ip, count, first_attempt) VALUES (?, ?, datetime('now'))"
        ).bind(clientIP, newCount).run();

        return jsonResponse({
          success: false,
          message: `Invalid password. ${MAX_ATTEMPTS - newCount} attempts remaining.`,
        }, 401);
      }
    }
  } catch (error: any) {
    return jsonResponse({ success: false, message: 'Server error: ' + (error?.message || String(error)) }, 500);
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
