import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { AppConfig } from './types.js';

// ============================================================
//  Gerenciamento de Configuração (~/.openmux/config.json)
// ============================================================

const CONFIG_DIR = path.join(os.homedir(), '.openmux');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Retorna a configuração padrão (vazia).
 */
function getDefaultConfig(): AppConfig {
  return {
    activeProvider: '',
    activeModel: '',
    providers: {},
  };
}

/**
 * Carrega a configuração do disco.
 * Se não existir, retorna a config padrão.
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as AppConfig;
  } catch {
    return getDefaultConfig();
  }
}

/**
 * Salva a configuração no disco.
 * Cria o diretório ~/.openmux se não existir.
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Retorna o caminho do diretório de configuração.
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Retorna o caminho do arquivo de configuração.
 */
export function getConfigFile(): string {
  return CONFIG_FILE;
}
