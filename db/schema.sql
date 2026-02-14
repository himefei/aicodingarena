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
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE CASCADE
);

-- Demo Likes: one like per IP per demo
CREATE TABLE IF NOT EXISTS demo_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  demo_id TEXT NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(demo_id, ip),
  FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE
);

-- Model Brands: company/brand identifiers with SVG logos
CREATE TABLE IF NOT EXISTS model_brands (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_filename TEXT NOT NULL
);

-- Models Registry: individual AI models belonging to a brand
CREATE TABLE IF NOT EXISTS models_registry (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_key TEXT,
  logo_filename TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  FOREIGN KEY (brand_key) REFERENCES model_brands(key)
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

-- Seed: model brands
INSERT OR IGNORE INTO model_brands (key, name, logo_filename) VALUES
  ('openai', 'OpenAI', 'openai.svg'),
  ('anthropic', 'Anthropic', 'anthropic.svg'),
  ('gemini', 'Gemini', 'gemini.svg'),
  ('deepseek', 'DeepSeek', 'deepseek.svg'),
  ('grok', 'Grok', 'grok.svg'),
  ('llama', 'Llama', 'llama.svg'),
  ('qwen', 'Qwen', 'qwen.svg'),
  ('mistral', 'Mistral', 'mistral.svg'),
  ('glm', 'GLM', 'glm.svg'),
  ('cohere', 'Cohere', 'cohere.svg'),
  ('huggingface', 'Hugging Face', 'huggingface.svg'),
  ('minimax', 'MiniMax', 'minimax.svg');

-- Seed: AI models (one legacy model per brand for backward compat)
INSERT OR IGNORE INTO models_registry (key, name, brand_key, logo_filename, color) VALUES
  ('openai', 'OpenAI', 'openai', 'openai.svg', '#10a37f'),
  ('anthropic', 'Anthropic', 'anthropic', 'anthropic.svg', '#d97706'),
  ('gemini', 'Gemini', 'gemini', 'gemini.svg', '#4285f4'),
  ('deepseek', 'DeepSeek', 'deepseek', 'deepseek.svg', '#4d6bfe'),
  ('grok', 'Grok', 'grok', 'grok.svg', '#1d9bf0'),
  ('llama', 'Llama', 'llama', 'llama.svg', '#0668e1'),
  ('qwen', 'Qwen', 'qwen', 'qwen.svg', '#6c3baa'),
  ('mistral', 'Mistral', 'mistral', 'mistral.svg', '#f97316'),
  ('glm', 'GLM', 'glm', 'glm.svg', '#3b82f6'),
  ('cohere', 'Cohere', 'cohere', 'cohere.svg', '#39594d'),
  ('huggingface', 'Hugging Face', 'huggingface', 'huggingface.svg', '#ffbd45'),
  ('minimax', 'MiniMax', 'minimax', 'minimax.svg', '#6366f1');
