/**
 * Cloudflare Pages Function - Demos API
 * GET: list demos (optional ?tab= filter)
 * POST: upload a new demo (code + metadata)
 */

import type { Env } from '../../src/lib/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyToken(request: Request, adminPassword: string): boolean {
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

// Pyodide wrapper template for Python demos
function wrapPythonAsHtml(pythonCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Python Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #e0e0e0; font-family: 'Courier New', monospace; min-height: 100vh; }
    #loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; }
    #loading .spinner { width: 48px; height: 48px; border: 3px solid #333; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #loading .progress { font-size: 14px; color: #94a3b8; }
    #output { padding: 20px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.6; }
    #canvas-container { display: flex; justify-content: center; padding: 20px; }
    canvas { max-width: 100%; }
    .error { color: #ef4444; background: #1e1e2d; padding: 16px; border-radius: 8px; margin: 20px; border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div class="progress">Loading Python runtime...</div>
  </div>
  <div id="output" style="display:none;"></div>
  <div id="canvas-container" style="display:none;"></div>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"></script>
  <script>
    async function main() {
      const loadingEl = document.getElementById('loading');
      const progressEl = loadingEl.querySelector('.progress');
      const outputEl = document.getElementById('output');

      try {
        progressEl.textContent = 'Initializing Pyodide...';
        const pyodide = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });

        progressEl.textContent = 'Installing packages...';
        // Pre-install common packages
        await pyodide.loadPackage(['micropip']);
        const micropip = pyodide.pyimport('micropip');

        // Redirect stdout to output div
        pyodide.runPython(\`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.outputs = []
    def write(self, text):
        self.outputs.append(text)
        if text.strip():
            el = document.getElementById('output')
            if el:
                el.style.display = 'block'
                el.textContent += text
    def flush(self):
        pass

sys.stdout = OutputCapture()
sys.stderr = OutputCapture()
\`);

        loadingEl.style.display = 'none';

        // Run user code
        progressEl.textContent = 'Running...';
        await pyodide.runPythonAsync(${JSON.stringify(pythonCode)});

      } catch (error) {
        loadingEl.style.display = 'none';
        outputEl.style.display = 'block';
        outputEl.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
      }
    }
    main();
  </script>
</body>
</html>`;
}

// GET /api/demos?tab=tabId
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const tabId = url.searchParams.get('tab');

  try {
    let result;
    if (tabId) {
      result = await env.ARENA_DB.prepare(
        'SELECT * FROM demos WHERE tab_id = ? ORDER BY created_at DESC'
      ).bind(tabId).all();
    } else {
      result = await env.ARENA_DB.prepare(
        'SELECT * FROM demos ORDER BY created_at DESC'
      ).all();
    }
    return new Response(JSON.stringify(result.results), { headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch demos' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

// POST /api/demos - Upload a new demo
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!verifyToken(request, env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  try {
    const body = await request.json() as {
      tab_id: string;
      model_key: string;
      model_name: string;
      demo_type: 'html' | 'python';
      code: string;
      thumbnail?: string; // base64
    };

    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileKey = `demos/${id}/index.html`;

    // For Python type, wrap code in Pyodide HTML template
    let htmlContent: string;
    if (body.demo_type === 'python') {
      htmlContent = wrapPythonAsHtml(body.code);
    } else {
      htmlContent = body.code;
    }

    // Upload HTML to R2
    await env.ARENA_FILES.put(fileKey, htmlContent, {
      httpMetadata: { contentType: 'text/html' },
    });

    // Upload thumbnail if provided
    let thumbnailKey: string | null = null;
    if (body.thumbnail) {
      thumbnailKey = `demos/${id}/thumbnail.png`;
      const thumbData = Uint8Array.from(atob(body.thumbnail.replace(/^data:image\/\w+;base64,/, '')), c => c.charCodeAt(0));
      await env.ARENA_FILES.put(thumbnailKey, thumbData, {
        httpMetadata: { contentType: 'image/png' },
      });
    }

    // Store metadata in D1
    await env.ARENA_DB.prepare(
      'INSERT INTO demos (id, tab_id, model_name, model_key, file_r2_key, thumbnail_r2_key, demo_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.tab_id, body.model_name, body.model_key, fileKey, thumbnailKey, body.demo_type).run();

    const demo = await env.ARENA_DB.prepare('SELECT * FROM demos WHERE id = ?').bind(id).first();
    return new Response(JSON.stringify(demo), { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload demo' }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
