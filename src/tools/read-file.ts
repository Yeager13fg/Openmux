import fs from 'node:fs/promises';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

// ============================================================
//  Tool: read_file
//  Lê o conteúdo de arquivos (completo ou intervalo de linhas)
// ============================================================

export const readFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Lê o conteúdo de um arquivo. Pode ler o arquivo inteiro ou um intervalo específico de linhas.',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Caminho do arquivo a ser lido',
          },
          startLine: {
            type: 'number',
            description: 'Linha inicial (1-indexed, opcional). Se omitido, lê do início.',
          },
          endLine: {
            type: 'number',
            description: 'Linha final (1-indexed, inclusiva, opcional). Se omitido, lê até o fim.',
          },
        },
        required: ['filePath'],
      },
    },
  },

  handler: async (args, ctx) => {
    const filePath = args.filePath as string;
    const startLine = args.startLine as number | undefined;
    const endLine = args.endLine as number | undefined;

    if (!(await validatePathAccess(filePath, ctx))) {
      return accessDeniedMessage(filePath);
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Aplica o filtro de linhas se especificado
      const start = startLine ? startLine - 1 : 0;
      const end = endLine ? endLine : lines.length;
      const selectedLines = lines.slice(start, end);

      const totalLines = lines.length;
      const showing = selectedLines.length;

      // Adiciona números de linha para contexto
      const numbered = selectedLines
        .map((line, i) => `${start + i + 1}: ${line}`)
        .join('\n');

      return `Conteúdo de ${filePath} (linhas ${start + 1}-${start + showing} de ${totalLines}):\n\n${numbered}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao ler arquivo: ${msg}`;
    }
  },
};
