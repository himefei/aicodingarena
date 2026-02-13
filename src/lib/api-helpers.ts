/** Shared helpers for API routes */

export function verifyToken(request: Request, adminPassword: string): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = atob(token);
    const expectedSuffix = ':' + adminPassword.slice(0, 8);
    if (!decoded.endsWith(expectedSuffix)) return false;
    const jsonPart = decoded.slice(0, decoded.length - expectedSuffix.length);
    const tokenData = JSON.parse(jsonPart);
    return tokenData.exp > Date.now() && tokenData.admin === true;
  } catch {
    return false;
  }
}

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), { status, headers: CORS_HEADERS });
}

export function getEnv(locals: App.Locals) {
  return locals.runtime.env;
}
