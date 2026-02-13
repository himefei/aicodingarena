/** Predefined AI model registry with logos and brand colors */
export interface ModelDef {
  key: string;
  name: string;
  logoFilename: string;
  color: string;
}

export const PREDEFINED_MODELS: ModelDef[] = [
  { key: 'chatgpt', name: 'ChatGPT', logoFilename: 'chatgpt.svg', color: '#10a37f' },
  { key: 'gpt4o', name: 'GPT-4o', logoFilename: 'chatgpt.svg', color: '#10a37f' },
  { key: 'o1', name: 'o1', logoFilename: 'chatgpt.svg', color: '#10a37f' },
  { key: 'o3', name: 'o3', logoFilename: 'chatgpt.svg', color: '#10a37f' },
  { key: 'claude', name: 'Claude', logoFilename: 'claude.svg', color: '#d97706' },
  { key: 'claude-sonnet', name: 'Claude Sonnet', logoFilename: 'claude.svg', color: '#d97706' },
  { key: 'claude-opus', name: 'Claude Opus', logoFilename: 'claude.svg', color: '#d97706' },
  { key: 'gemini', name: 'Gemini', logoFilename: 'gemini.svg', color: '#4285f4' },
  { key: 'gemini-pro', name: 'Gemini Pro', logoFilename: 'gemini.svg', color: '#4285f4' },
  { key: 'gemini-flash', name: 'Gemini Flash', logoFilename: 'gemini.svg', color: '#4285f4' },
  { key: 'deepseek', name: 'DeepSeek', logoFilename: 'deepseek.svg', color: '#4d6bfe' },
  { key: 'deepseek-v3', name: 'DeepSeek V3', logoFilename: 'deepseek.svg', color: '#4d6bfe' },
  { key: 'deepseek-r1', name: 'DeepSeek R1', logoFilename: 'deepseek.svg', color: '#4d6bfe' },
  { key: 'llama', name: 'Llama', logoFilename: 'llama.svg', color: '#0668e1' },
  { key: 'grok', name: 'Grok', logoFilename: 'grok.svg', color: '#1d9bf0' },
  { key: 'qwen', name: 'Qwen', logoFilename: 'qwen.svg', color: '#6c3baa' },
  { key: 'mistral', name: 'Mistral', logoFilename: 'mistral.svg', color: '#f97316' },
  { key: 'copilot', name: 'GitHub Copilot', logoFilename: 'copilot.svg', color: '#000000' },
  { key: 'cursor', name: 'Cursor', logoFilename: 'cursor.svg', color: '#7c3aed' },
];

export function getModelByKey(key: string): ModelDef | undefined {
  return PREDEFINED_MODELS.find(m => m.key === key);
}

export function getModelLogo(key: string): string {
  const model = getModelByKey(key);
  return model ? `/logos/${model.logoFilename}` : '/logos/default.svg';
}
