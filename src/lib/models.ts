/** AI model registry with logos and brand colors */
export interface ModelDef {
  key: string;
  name: string;
  logoFilename: string;
  color: string;
}

/** Available SVG logo files in public/logos/ */
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
  { key: 'openai', name: 'OpenAI', logoFilename: 'openai.svg', color: '#10a37f' },
  { key: 'anthropic', name: 'Anthropic', logoFilename: 'anthropic.svg', color: '#d97706' },
  { key: 'gemini', name: 'Gemini', logoFilename: 'gemini.svg', color: '#4285f4' },
  { key: 'deepseek', name: 'DeepSeek', logoFilename: 'deepseek.svg', color: '#4d6bfe' },
  { key: 'grok', name: 'Grok', logoFilename: 'grok.svg', color: '#1d9bf0' },
  { key: 'llama', name: 'Llama', logoFilename: 'llama.svg', color: '#0668e1' },
  { key: 'qwen', name: 'Qwen', logoFilename: 'qwen.svg', color: '#6c3baa' },
  { key: 'mistral', name: 'Mistral', logoFilename: 'mistral.svg', color: '#f97316' },
  { key: 'glm', name: 'GLM', logoFilename: 'glm.svg', color: '#3b82f6' },
  { key: 'cohere', name: 'Cohere', logoFilename: 'cohere.svg', color: '#39594d' },
  { key: 'huggingface', name: 'Hugging Face', logoFilename: 'huggingface.svg', color: '#ffbd45' },
  { key: 'minimax', name: 'MiniMax', logoFilename: 'minimax.svg', color: '#6366f1' },
];

/** Runtime models cache populated from DB */
let _runtimeModels: ModelDef[] = [];

/** Call this on app load with models fetched from the DB API */
export function setRuntimeModels(models: Array<{ key: string; name: string; logo_filename: string; color: string }>) {
  _runtimeModels = models.map(m => ({
    key: m.key,
    name: m.name,
    logoFilename: m.logo_filename,
    color: m.color,
  }));
}

export function getModelByKey(key: string): ModelDef | undefined {
  return _runtimeModels.find(m => m.key === key)
    || PREDEFINED_MODELS.find(m => m.key === key);
}

export function getModelLogo(key: string): string {
  const model = getModelByKey(key);
  return model ? `/logos/${model.logoFilename}` : '/logos/default.svg';
}
