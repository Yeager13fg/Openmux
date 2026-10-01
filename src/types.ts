import type OpenAI from 'openai';

// ============================================================
//  Tipos de Provedores
// ============================================================

/** Informações de um provedor de IA pré-configurado */
export interface ProviderInfo {
  /** Identificador único (ex: 'groq', 'gemini') */
  name: string;
  /** Nome de exibição no menu (ex: 'Groq (Ultrarrápido)') */
  label: string;
  /** URL base da API compatível com OpenAI */
  baseURL: string;
  /** Modelo padrão recomendado para este provedor */
  defaultModel: string;
  /** Se o provedor requer chave de API (false para Ollama local) */
  requiresKey: boolean;
}

// ============================================================
//  Tipos de Configuração
// ============================================================

/** Dados de um provedor salvo pelo usuário */
export interface SavedProvider {
  apiKey: string;
  baseURL: string;
}

/** Configuração completa salva em ~/.termux-agent/config.json */
export interface AppConfig {
  /** Nome do provedor ativo (ex: 'groq') */
  activeProvider: string;
  /** Modelo ativo (ex: 'llama-3.3-70b-versatile') */
  activeModel: string;
  /** Provedores configurados com suas chaves */
  providers: Record<string, SavedProvider>;
}

// ============================================================
//  Tipos do Sistema de Ferramentas (Tools)
// ============================================================

export interface ToolContext {
  askUser: (message: string) => Promise<string>;
  selectUser?: (message: string, options: {label: string, value: string}[]) => Promise<string>;
}

/** Função que executa uma ferramenta e retorna o resultado como string */
export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>;

/** Definição completa de uma ferramenta (schema OpenAI + handler) */
export interface Tool {
  /** Definição no formato OpenAI (nome, descrição, parâmetros) */
  definition: OpenAI.Chat.Completions.ChatCompletionTool;
  /** Função que executa a ferramenta */
  handler: ToolHandler;
}

// ============================================================
//  Tipos de Mensagens / Conversa
// ============================================================

/** Tipo de mensagem na conversa (atalho para o tipo do SDK) */
export type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/** Acumulador para tool calls durante streaming */
export interface ToolCallAccumulator {
  id: string;
  name: string;
  arguments: string;
}
