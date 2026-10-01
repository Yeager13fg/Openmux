
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import pc from 'picocolors';
import { startRepl } from './repl.js';
import { getConfigDir } from './config.js';

// ============================================================
//  Ponto de Entrada (CLI)
//  Gerencia os subcomandos: (nenhum), update, uninstall
// ============================================================

async function askConfirm(message: string, defaultVal: boolean = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const prompt = defaultVal ? '[Y/n]' : '[y/N]';
  return new Promise((resolve) => {
    rl.question(`${message} ${prompt} `, (answer) => {
      rl.close();
      const lower = answer.trim().toLowerCase();
      if (lower === 'y' || lower === 'yes' || lower === 's' || lower === 'sim') return resolve(true);
      if (lower === 'n' || lower === 'no' || lower === 'nao' || lower === 'não') return resolve(false);
      resolve(defaultVal);
    });
  });
}

const REPO_URL = 'https://github.com/Yeager13fg/Openmux.git';
const PACKAGE_NAME = 'openmux';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'update':
      await handleUpdate();
      break;

    case 'uninstall':
      await handleUninstall();
      break;

    default:
      // Sem argumentos: inicia o REPL interativo
      await startRepl();
      break;
  }
}

// ============================================================
//  openmux update
//  Baixa a versão mais recente do GitHub e reinstala globalmente
// ============================================================

async function handleUpdate(): Promise<void> {
  console.log(pc.cyan('\n🔄 Atualizando OpenMux...\n'));

  // 1. Cria pasta temporária
  const tmpDir = path.join(os.tmpdir(), `openmux-update-${Date.now()}`);

  try {
    // 2. Clona o repositório
    console.log(pc.dim('📥 Baixando versão mais recente...'));
    execSync(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, {
      stdio: 'pipe',
    });

    // 3. Instala globalmente
    console.log(pc.dim('⚙️  Instalando atualização...'));
    // Cria um pacote tarball e instala a partir dele para evitar criação de symlink dependente da pasta temporária
    execSync('npm pack && npm install -g openmux-*.tgz', {
      cwd: tmpDir,
      stdio: 'pipe',
    });

    // 4. Limpa a pasta temporária
    console.log(pc.dim('🧹 Limpando arquivos temporários...'));
    await fs.rm(tmpDir, { recursive: true, force: true });

    console.log(pc.green('\n✅ Atualização concluída com sucesso!'));
    console.log(pc.dim('   Reinicie o agente para usar a nova versão.\n'));
  } catch (error: unknown) {
    // Limpa temp em caso de erro
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    const msg = (error as Error).message;
    console.log(pc.red(`\n❌ Erro na atualização: ${msg}`));
    console.log(pc.dim('Verifique sua conexão com a internet e tente novamente.\n'));
  }
}

// ============================================================
//  openmux uninstall
//  Remove o pacote global e opcionalmente limpa configurações
// ============================================================

async function handleUninstall(): Promise<void> {
  console.log(pc.red('\n🗑️  Desinstalação do OpenMux\n'));

  // Confirmação principal
  const confirmed = await askConfirm('Tem certeza que deseja desinstalar o openmux?', false);

  if (!confirmed) {
    console.log(pc.dim('\nDesinstalação cancelada.\n'));
    return;
  }

  // Pergunta se deseja remover as configurações
  const configDir = getConfigDir();
  const removeConfig = await askConfirm(`Deseja também apagar as configurações e chaves salvas? (${configDir})`, false);

  try {
    // 1. Remove o pacote global
    console.log(pc.dim('\n⚙️  Removendo pacote global...'));
    execSync(`npm uninstall -g ${PACKAGE_NAME}`, { stdio: 'pipe' });

    // 2. Remove configurações se solicitado
    if (removeConfig) {
      console.log(pc.dim('🧹 Removendo configurações...'));
      await fs.rm(configDir, { recursive: true, force: true });
    }

    console.log(pc.green('\n✅ Desinstalação concluída.'));

    if (!removeConfig) {
      console.log(
        pc.dim(`   Suas configurações foram mantidas em: ${configDir}`)
      );
    }

    console.log(pc.dim('   Obrigado por usar o OpenMux! 👋\n'));
  } catch (error: unknown) {
    const msg = (error as Error).message;
    console.log(pc.red(`\n❌ Erro na desinstalação: ${msg}\n`));
  }
}

// Executa
main().catch((err) => {
  console.error(pc.red('Erro fatal:'), err);
  process.exit(1);
});
