import path from 'node:path';
import type { ToolContext } from './types.js';

// ============================================================
//  Módulo de Segurança — Validação de Acesso a Caminhos
//  Garante que ferramentas peçam permissão ao sair do CWD
// ============================================================

/**
 * Verifica se um caminho está dentro do diretório de trabalho atual.
 * Se estiver fora, pede confirmação ao usuário.
 *
 * @returns `true` se o acesso foi permitido, `false` se rejeitado.
 */
export async function validatePathAccess(targetPath: string, ctx: ToolContext): Promise<boolean> {
  const cwd = process.cwd();
  const resolved = path.resolve(targetPath);

  // Se o caminho está dentro do CWD, libera automaticamente
  if (resolved.startsWith(cwd + path.sep) || resolved === cwd) {
    return true;
  }

  const ans = await ctx.askUser(`ATENÇÃO: A ferramenta quer acessar fora da pasta atual:\n  Alvo: ${resolved}\n  CWD: ${cwd}\nAutorizar acesso? [s]im / [n]ão:`);
  return ans.trim().toLowerCase().startsWith('s');
}

/**
 * Mensagem padrão retornada quando o acesso é negado.
 */
export function accessDeniedMessage(targetPath: string): string {
  return `O usuário NEGOU acesso ao caminho "${targetPath}" que está fora do diretório de trabalho atual. Use caminhos dentro do diretório atual ou peça permissão ao usuário com ask_user antes de tentar novamente.`;
}
