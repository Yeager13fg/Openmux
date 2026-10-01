import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { loadConfig } from './config.js';
import { createClient } from './llm.js';
import pc from 'picocolors';
import figlet from 'figlet';

export async function startRepl(): Promise<void> {
  const config = await loadConfig();

  if (config.activeProvider) {
    try {
      createClient(config);
    } catch {
      console.log(pc.yellow('[ Aviso ]: Erro ao conectar com o provedor. Use /provider.'));
    }
  }

  console.clear();
  const { waitUntilExit, clear } = render(<App initialConfig={config} />, { exitOnCtrlC: false });
  
  await waitUntilExit();
  
  // Limpa os resíduos visuais do Ink e zera a tela
  clear();
  process.stdout.write('\x1Bc');
  
  // Desenha a logo bonita
  const cols = process.stdout.columns || 80;
  let fontToUse = 'Slant';
  if (cols < 50) fontToUse = 'Mini';
  else if (cols < 70) fontToUse = 'Small Slant';

  const logo = figlet.textSync('OpenMux', { font: fontToUse as any });
  console.log(pc.cyan(logo));
  console.log(pc.green('  Sessão encerrada com sucesso. Até a próxima!\n'));
  
  process.exit(0);
}
