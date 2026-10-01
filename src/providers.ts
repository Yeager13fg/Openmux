import type { ProviderInfo } from './types.js';

// ============================================================
//  Lista de provedores compatíveis com o protocolo OpenAI
// ============================================================

export const PROVIDERS: ProviderInfo[] = [
  {
    name: 'groq',
    label: 'Groq (Ultrarrápido • Llama 3.3)',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresKey: true,
  },
  {
    name: 'openrouter',
    label: 'OpenRouter (200+ modelos)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.5-flash',
    requiresKey: true,
  },
  {
    name: 'gemini',
    label: 'Google Gemini (Gratuito • Contexto longo)',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.5-flash',
    requiresKey: true,
  },
  {
    name: 'deepseek',
    label: 'DeepSeek (V3 / R1 • Custo baixo)',
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    requiresKey: true,
  },
  {
    name: 'openai',
    label: 'OpenAI (GPT-4o)',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true,
  },
  {
    name: 'mistral',
    label: 'Mistral AI (Codestral / Large)',
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    requiresKey: true,
  },
  {
    name: 'together',
    label: 'Together AI (Open-source rápido)',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    requiresKey: true,
  },
  {
    name: 'ollama',
    label: 'Ollama (Local / Offline)',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    requiresKey: false,
  },
];

/**
 * Busca um provedor pelo nome.
 */
export function getProvider(name: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.name === name);
}

/**
 * Retorna a lista de nomes de provedores disponíveis.
 */
export function getProviderNames(): string[] {
  return PROVIDERS.map((p) => p.name);
}
