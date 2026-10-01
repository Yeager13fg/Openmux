import OpenAI from 'openai';
import type { AppConfig } from './types.js';
import { getProvider } from './providers.js';

// ============================================================
//  Gerenciamento do Cliente OpenAI (Universal)
// ============================================================

let client: OpenAI | null = null;

/**
 * Cria (ou recria) o cliente OpenAI com base na config atual.
 * Usa o baseURL do provedor ativo para conectar a qualquer API compatível.
 */
export function createClient(config: AppConfig): OpenAI {
  const saved = config.providers[config.activeProvider];

  if (!saved) {
    throw new Error(
      `Provedor "${config.activeProvider}" não está configurado. Use /provider para configurar.`
    );
  }

  client = new OpenAI({
    apiKey: saved.apiKey || 'not-needed',
    baseURL: saved.baseURL,
  });

  return client;
}

/**
 * Retorna o cliente atual ou lança erro se não estiver inicializado.
 */
export function getClient(): OpenAI {
  if (!client) {
    throw new Error('Cliente LLM não inicializado. Use /provider para configurar.');
  }
  return client;
}

/**
 * Verifica se um provedor tem configuração salva válida.
 */
export function isProviderConfigured(config: AppConfig, providerName: string): boolean {
  const saved = config.providers[providerName];
  if (!saved) return false;

  const info = getProvider(providerName);
  // Se o provedor não requer chave (ex: Ollama), está sempre OK
  if (info && !info.requiresKey) return true;

  return !!saved.apiKey;
}
