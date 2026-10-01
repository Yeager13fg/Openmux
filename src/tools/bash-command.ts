import { execSync } from 'node:child_process';
import type { Tool } from '../types.js';

const TIMEOUT_MS = 30_000;

export const bashCommandTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'bash_command',
      description: 'Executa um comando no terminal/shell. O usuário SEMPRE será consultado.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['command', 'reason'],
      },
    },
  },

  handler: async (args, ctx) => {
    const command = args.command as string;
    const reason = args.reason as string;

    let choice: string;
    if (ctx.selectUser) {
      choice = await ctx.selectUser(`Executar comando: ${command}\nMotivo: ${reason}\nSelecione uma ação:`, [
        { label: 'Sim, executar o comando', value: 's' },
        { label: 'Não, rejeitar o comando', value: 'n' },
        { label: 'Editar o comando', value: 'e' }
      ]);
    } else {
      const action = await ctx.askUser(`Executar comando: ${command}\nMotivo: ${reason}\nAutorizar? [s]im / [n]ão / [e]ditar:`);
      choice = action.trim().toLowerCase();
    }

    if (choice === 'n' || choice.startsWith('nã') || choice.startsWith('na')) {
      return 'O usuário REJEITOU a execução deste comando.';
    }

    let finalCommand = command;
    if (choice === 'e' || choice.startsWith('ed')) {
      finalCommand = await ctx.askUser('Digite o comando editado:');
    }

    try {
      const output = execSync(finalCommand, {
        encoding: 'utf-8',
        timeout: TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
        cwd: process.cwd(),
      });
      const result = output.trim() || '(comando executado sem saída)';
      return `Comando executado com sucesso.\n\nSaída:\n${result}`;
    } catch (error: unknown) {
      const err = error as { stderr?: string; message?: string; status?: number };
      const stderr = err.stderr || err.message || 'Erro desconhecido';
      return `Erro ao executar o comando (código de saída: ${err.status || '?'}).\n\nSaída de erro:\n${stderr}`;
    }
  },
};
