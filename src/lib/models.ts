/** AI model registry with logos and brand colors */
export interface ModelDef {
  key: string;
  name: string;
  brandKey: string;
  logoFilename: string;
  color: string;
}

export interface BrandDef {
  key: string;
  name: string;
  logoFilename: string;
}

/** Available SVG logo files (kept as static fallback) */
export const AVAILABLE_LOGOS: string[] = [
  'anthropic.svg',
  'cohere.svg',
  'deepseek.svg',
  'gemini.svg',
  'glm.svg',
  'grok.svg',
  'huggingface.svg',
  'llama.svg',
  'minimax.svg',
  'mistral.svg',
  'openai.svg',
  'qwen.svg',
];

export const PREDEFINED_MODELS: ModelDef[] = [
  { key: 'openai', name: 'OpenAI', brandKey: 'openai', logoFilename: 'openai.svg', color: '#10a37f' },
  { key: 'anthropic', name: 'Anthropic', brandKey: 'anthropic', logoFilename: 'anthropic.svg', color: '#d97706' },
  { key: 'gemini', name: 'Gemini', brandKey: 'gemini', logoFilename: 'gemini.svg', color: '#4285f4' },
  { key: 'deepseek', name: 'DeepSeek', brandKey: 'deepseek', logoFilename: 'deepseek.svg', color: '#4d6bfe' },
  { key: 'grok', name: 'Grok', brandKey: 'grok', logoFilename: 'grok.svg', color: '#1d9bf0' },
  { key: 'llama', name: 'Llama', brandKey: 'llama', logoFilename: 'llama.svg', color: '#0668e1' },
  { key: 'qwen', name: 'Qwen', brandKey: 'qwen', logoFilename: 'qwen.svg', color: '#6c3baa' },
  { key: 'mistral', name: 'Mistral', brandKey: 'mistral', logoFilename: 'mistral.svg', color: '#f97316' },
  { key: 'glm', name: 'GLM', brandKey: 'glm', logoFilename: 'glm.svg', color: '#3b82f6' },
  { key: 'cohere', name: 'Cohere', brandKey: 'cohere', logoFilename: 'cohere.svg', color: '#39594d' },
  { key: 'huggingface', name: 'Hugging Face', brandKey: 'huggingface', logoFilename: 'huggingface.svg', color: '#ffbd45' },
  { key: 'minimax', name: 'MiniMax', brandKey: 'minimax', logoFilename: 'minimax.svg', color: '#6366f1' },
];

/** Runtime caches populated from DB */
let _runtimeModels: ModelDef[] = [];
let _runtimeBrands: BrandDef[] = [];

/** Call on app load with models fetched from the DB API */
export function setRuntimeModels(
  models: Array<{ key: string; name: string; brand_key?: string; logo_filename: string; color?: string }>
) {
  _runtimeModels = models.map((m) => ({
    key: m.key,
    name: m.name,
    brandKey: m.brand_key || m.key,
    logoFilename: m.logo_filename,
    color: m.color || '#6366f1',
  }));
}

/** Call on app load with brands fetched from the DB API */
export function setRuntimeBrands(
  brands: Array<{ key: string; name: string; logo_filename: string }>
) {
  _runtimeBrands = brands.map((b) => ({
    key: b.key,
    name: b.name,
    logoFilename: b.logo_filename,
  }));
}

export function getModelByKey(key: string): ModelDef | undefined {
  return _runtimeModels.find((m) => m.key === key)
    || PREDEFINED_MODELS.find((m) => m.key === key);
}

export function getModelLogo(key: string): string {
  const model = getModelByKey(key);
  if (model) {
    return `/api/logo/${model.logoFilename}`;
  }
  return '/api/logo/default.svg';
}
