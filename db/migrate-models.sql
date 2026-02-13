-- Migration: Replace old model entries with new SVG-based models
-- Run this against the D1 database to update model data

-- Remove all old models
DELETE FROM models_registry;

-- Insert new models based on available SVG logos
INSERT INTO models_registry (key, name, logo_filename, color) VALUES
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
