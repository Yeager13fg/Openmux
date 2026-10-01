import fs from 'node:fs/promises';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

// ============================================================
//  Tool: edit_file
//  Edição cirúrgica de trechos de arquivos (oldText -> newText)
// ============================================================

export const editFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'edit_file',
      description:
        'Edita um arquivo existente substituindo um trecho de texto por outro. Busca o "oldText" exato no arquivo e substitui pelo "newText". Ideal para modificações cirúrgicas sem reescrever o arquivo inteiro.',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Caminho do arquivo a ser editado',
          },
          oldText: {
            type: 'string',
            description: 'Texto exato a ser encontrado e substituído (deve ser único no arquivo)',
          },
          newText: {
            type: 'string',
            description: 'Novo texto que substituirá o oldText',
          },
        },
        required: ['filePath', 'oldText', 'newText'],
      },
    },
  },

  handler: async (args, ctx) => {
    const filePath = args.filePath as string;
    const oldText = args.oldText as string;
    const newText = args.newText as string;

    if (!(await validatePathAccess(filePath, ctx))) {
      return accessDeniedMessage(filePath);
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Verifica se o oldText existe no arquivo
      const occurrences = content.split(oldText).length - 1;

      if (occurrences === 0) {
        return `Erro: O trecho de texto especificado em "oldText" NÃO foi encontrado no arquivo ${filePath}. Verifique se o texto está exatamente correto (incluindo espaços e quebras de linha).`;
      }

      if (occurrences > 1) {
        return `Erro: O trecho de texto foi encontrado ${occurrences} vezes no arquivo. O oldText precisa ser único. Inclua mais contexto (linhas ao redor) para torná-lo único.`;
      }

      // Substitui o trecho
      const newContent = content.replace(oldText, newText);
      await fs.writeFile(filePath, newContent, 'utf-8');

      return `Arquivo editado com sucesso: ${filePath}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao editar arquivo: ${msg}`;
    }
  },
};
