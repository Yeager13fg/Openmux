import type { Tool } from '../types.js';
import { bashCommandTool } from './bash-command.js';
import { createFileTool } from './create-file.js';
import { readFileTool } from './read-file.js';
import { editFileTool } from './edit-file.js';
import { deletePathTool } from './delete-path.js';
import { createDirectoryTool } from './create-directory.js';
import { listDirectoryTool } from './list-directory.js';
import { askUserTool } from './ask-user.js';

// ============================================================
//  Registro Central de Ferramentas
//  Todas as tools disponíveis para o agente
// ============================================================

/** Lista completa de ferramentas disponíveis */
export const ALL_TOOLS: Tool[] = [
  bashCommandTool,
  createFileTool,
  readFileTool,
  editFileTool,
  deletePathTool,
  createDirectoryTool,
  listDirectoryTool,
  askUserTool,
];

/**
 * Retorna as definições das ferramentas no formato OpenAI.
 * Usado para enviar na chamada da API.
 */
export function getToolDefinitions() {
  return ALL_TOOLS.map((t) => t.definition);
}

/**
 * Busca o handler de uma ferramenta pelo nome.
 */
export function getToolHandler(name: string) {
  const tool = ALL_TOOLS.find(
    (t) => t.definition.function.name === name
  );
  return tool?.handler;
}

/**
 * Retorna a lista de nomes das ferramentas.
 */
export function getToolNames(): string[] {
  return ALL_TOOLS.map((t) => t.definition.function.name);
}
