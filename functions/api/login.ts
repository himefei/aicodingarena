/**
 * Cloudflare Pages Function - Admin Login API
 * Password stored in environment variable (server-side only)
 * Includes brute-force protection with IP-based rate limiting via D1
 */

import type { Env } from '../../src/lib/types';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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
        return new Response(
          JSON.stringify({
            success: false,
            message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
            locked: true,
            remainingMinutes,
          }),
          { status: 429, headers: CORS_HEADERS }
        );
      } else {
        // Lock expired, reset
        await env.ARENA_DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIP).run();
      }
    }

    const body = await request.json() as { password?: string };
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Password required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (password === adminPassword) {
      // Clear failed attempts on success
      await env.ARENA_DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(clientIP).run();

      // Generate session token (24h validity)
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      const tokenData = { admin: true, exp: expiry };
      const token = btoa(JSON.stringify(tokenData) + ':' + adminPassword.slice(0, 8));

      return new Response(
        JSON.stringify({ success: true, token, expiresAt: expiry }),
        { status: 200, headers: CORS_HEADERS }
      );
    } else {
      // Record failed attempt
      const currentCount = attempt?.count || 0;
      const newCount = currentCount + 1;

      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        await env.ARENA_DB.prepare(
          'INSERT OR REPLACE INTO login_attempts (ip, count, locked_until) VALUES (?, ?, ?)'
        ).bind(clientIP, newCount, lockedUntil).run();

        return new Response(
          JSON.stringify({
            success: false,
            message: 'Too many failed attempts. Account locked for 1 hour.',
            locked: true,
            remainingMinutes: 60,
          }),
          { status: 429, headers: CORS_HEADERS }
        );
      } else {
        await env.ARENA_DB.prepare(
          'INSERT OR REPLACE INTO login_attempts (ip, count, first_attempt) VALUES (?, ?, datetime(\'now\'))'
        ).bind(clientIP, newCount).run();

        return new Response(
          JSON.stringify({
            success: false,
            message: `Invalid password. ${MAX_ATTEMPTS - newCount} attempts remaining.`,
          }),
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid request' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
