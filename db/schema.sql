-- AI Coding Arena Database Schema

-- Tabs: different demo categories/projects
CREATE TABLE IF NOT EXISTS tabs (
  id TEXT PRIMARY KEY,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Demos: individual AI-generated code demos
CREATE TABLE IF NOT EXISTS demos (
  id TEXT PRIMARY KEY,
  tab_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_key TEXT NOT NULL,
  file_r2_key TEXT NOT NULL,
  thumbnail_r2_key TEXT,
  demo_type TEXT NOT NULL DEFAULT 'html' CHECK(demo_type IN ('html', 'python')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE CASCADE
);

-- Models Registry: predefined AI model metadata
CREATE TABLE IF NOT EXISTS models_registry (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_filename TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

-- Rate limiting for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  first_attempt TEXT DEFAULT (datetime('now')),
  locked_until TEXT
);

-- Seed: default tabs
INSERT OR IGNORE INTO tabs (id, name_cn, name_en, slug, sort_order) VALUES
  ('tab-phone-os', '手机操作系统模拟器', 'Phone OS Simulator', 'phone-os-simulator', 1),
  ('tab-hex-balls', 'Python六边形小球', 'Python Hexagonal Balls', 'python-hex-balls', 2);

-- Seed: AI models (based on available SVG logos)
INSERT OR IGNORE INTO models_registry (key, name, logo_filename, color) VALUES
  ('openai', 'OpenAI', 'openai.svg', '#10a37f'),
  ('anthropic', 'Anthropic', 'anthropic.svg', '#d97706'),
  ('gemini', 'Gemini', 'gemini.svg', '#4285f4'),
  ('deepseek', 'DeepSeek', 'deepseek.svg', '#4d6bfe'),
  ('grok', 'Grok', 'grok.svg', '#1d9bf0'),
  ('llama', 'Llama', 'llama.svg', '#0668e1'),
  ('qwen', 'Qwen', 'qwen.svg', '#6c3baa'),
  ('mistral', 'Mistral', 'mistral.svg', '#f97316'),
  ('glm', 'GLM', 'glm.svg', '#3b82f6'),
  ('cohere', 'Cohere', 'cohere.svg', '#39594d'),
  ('huggingface', 'Hugging Face', 'huggingface.svg', '#ffbd45'),
  ('minimax', 'MiniMax', 'minimax.svg', '#6366f1');
