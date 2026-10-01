import fs from 'node:fs/promises';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

// ============================================================
//  Tool: create_directory
//  Criação recursiva de diretórios (mkdir -p)
// ============================================================

export const createDirectoryTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'create_directory',
      description:
        'Cria um novo diretório. Se os diretórios pais não existirem, eles são criados automaticamente (equivalente a mkdir -p).',
      parameters: {
        type: 'object',
        properties: {
          dirPath: {
            type: 'string',
            description: 'Caminho do diretório a ser criado (ex: "./src/components")',
          },
        },
        required: ['dirPath'],
      },
    },
  },

  handler: async (args, ctx) => {
    const dirPath = args.dirPath as string;

    if (!(await validatePathAccess(dirPath, ctx))) {
      return accessDeniedMessage(dirPath);
    }

    try {
      await fs.mkdir(dirPath, { recursive: true });
      return `Diretório criado com sucesso: ${dirPath}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao criar diretório: ${msg}`;
    }
  },
};
