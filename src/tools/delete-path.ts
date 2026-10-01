import fs from 'node:fs/promises';
import { validatePathAccess, accessDeniedMessage } from '../security.js';
import type { Tool } from '../types.js';

export const deletePathTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'delete_path',
      description: 'Remove um arquivo ou diretório.',
      parameters: {
        type: 'object',
        properties: {
          targetPath: { type: 'string' },
          recursive: { type: 'boolean' },
        },
        required: ['targetPath'],
      },
    },
  },

  handler: async (args, ctx) => {
    const targetPath = args.targetPath as string;
    const recursive = (args.recursive as boolean) ?? false;

    if (!(await validatePathAccess(targetPath, ctx))) {
      return accessDeniedMessage(targetPath);
    }

    try {
      const stat = await fs.stat(targetPath);
      const isDir = stat.isDirectory();

      let ans: string;
      if (ctx.selectUser) {
        ans = await ctx.selectUser(`Deletar ${isDir ? 'diretório' : 'arquivo'}: ${targetPath}\nTem certeza?`, [
          { label: 'Sim, excluir', value: 's' },
          { label: 'Não, cancelar', value: 'n' }
        ]);
      } else {
        ans = await ctx.askUser(`Deletar ${isDir ? 'diretório' : 'arquivo'}: ${targetPath}\nTem certeza? [s]im / [n]ão:`);
      }

      if (!ans.trim().toLowerCase().startsWith('s')) {
        return 'O usuário CANCELOU a exclusão.';
      }

      if (isDir) {
        await fs.rm(targetPath, { recursive, force: true });
      } else {
        await fs.unlink(targetPath);
      }

      return `Removido com sucesso: ${targetPath}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao remover: ${msg}`;
    }
  },
};
