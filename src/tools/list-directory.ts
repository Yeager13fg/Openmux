import fs from 'node:fs/promises';
import path from 'node:path';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

// ============================================================
//  Tool: list_directory
//  Listagem de arquivos e pastas em um diretório
// ============================================================

export const listDirectoryTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'list_directory',
      description:
        'Lista os arquivos e subdiretórios de um diretório especificado, incluindo tipo (arquivo/pasta) e tamanho.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: {
            type: 'string',
            description: 'Caminho do diretório a ser listado (ex: "." para o diretório atual)',
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
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      if (entries.length === 0) {
        return `O diretório ${dirPath} está vazio.`;
      }

      const lines: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const type = entry.isDirectory() ? '📁' : '📄';

        if (entry.isFile()) {
          try {
            const stat = await fs.stat(fullPath);
            const sizeKB = (stat.size / 1024).toFixed(1);
            lines.push(`${type} ${entry.name}  (${sizeKB} KB)`);
          } catch {
            lines.push(`${type} ${entry.name}`);
          }
        } else {
          lines.push(`${type} ${entry.name}/`);
        }
      }

      return `Conteúdo de ${dirPath}:\n\n${lines.join('\n')}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao listar diretório: ${msg}`;
    }
  },
};
