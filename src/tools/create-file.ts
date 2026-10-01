import fs from 'node:fs/promises';
import path from 'node:path';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

// ============================================================
//  Tool: create_file
//  Cria arquivos novos (com criação automática de diretórios)
// ============================================================

export const createFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'create_file',
      description:
        'Cria um novo arquivo com o conteúdo especificado. Diretórios pais são criados automaticamente se não existirem.',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Caminho completo do arquivo a ser criado (ex: "./src/index.js")',
          },
          content: {
            type: 'string',
            description: 'Conteúdo completo do arquivo',
          },
        },
        required: ['filePath', 'content'],
      },
    },
  },

  handler: async (args, ctx) => {
    const filePath = args.filePath as string;
    const content = args.content as string;

    if (!(await validatePathAccess(filePath, ctx))) {
      return accessDeniedMessage(filePath);
    }

    try {
      // Cria os diretórios pais se necessário
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Escreve o arquivo
      await fs.writeFile(filePath, content, 'utf-8');

      const size = Buffer.byteLength(content, 'utf-8');
      return `Arquivo criado com sucesso: ${filePath} (${size} bytes)`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao criar arquivo: ${msg}`;
    }
  },
};
