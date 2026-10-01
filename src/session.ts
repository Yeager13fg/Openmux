import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Message } from './types.js';

const SESSIONS_DIR = path.join(os.homedir(), '.openmux', 'sessions');
let currentSessionFile = '';

/**
 * Cria o diretório de sessões (se não existir) e gera um novo arquivo para a sessão atual.
 */
export async function initSession(firstPrompt?: string): Promise<void> {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  
  const now = new Date();
  // Formato: YYYY-MM-DD_HH-MM-SS
  const timestamp = now.toISOString().replace(/T/, '_').replace(/[:.]/g, '-').slice(0, 19);
  
  let topic = '';
  if (firstPrompt) {
    topic = '_' + firstPrompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }
  
  currentSessionFile = path.join(SESSIONS_DIR, `session_${timestamp}${topic}.json`);
}

/**
 * Salva o array de mensagens na sessão atual.
 * Cria o arquivo na primeira vez que o usuário envia uma mensagem.
 */
export async function saveSession(messages: Message[]): Promise<void> {
  const userMessages = messages.filter(m => m.role === 'user');
  
  // Não salva se for apenas uma sessão recém aberta vazia
  if (userMessages.length === 0) return;
  
  // Inicializa o arquivo se ainda não tiver um (com o tema da primeira pergunta)
  if (!currentSessionFile) {
    await initSession(userMessages[0]?.content as string);
  }
  
  try {
    await fs.writeFile(currentSessionFile, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (error) {
    // Ignora erros de salvamento em background
  }
}

/**
 * Busca as últimas 'limit' sessões salvas.
 */
export async function getRecentSessions(limit = 4): Promise<{ label: string; value: string }[]> {
  try {
    const files = await fs.readdir(SESSIONS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // Ordena do mais recente para o mais antigo (ordem alfabética inversa)
    jsonFiles.sort((a, b) => b.localeCompare(a));

    const topFiles = jsonFiles.slice(0, limit);

    return topFiles.map(file => {
      // Formato esperado: session_YYYY-MM-DD_HH-MM-SS_assunto.json
      const match = file.match(/session_([0-9-]{10})_([0-9-]{8})(?:_(.*))?\.json/);
      let label = file;
      
      if (match) {
        const dateStr = match[1];
        const timeStr = match[2];
        const topicStr = match[3];

        const dateParts = dateStr!.split('-');
        const timeParts = timeStr!.split('-');
        
        if (dateParts.length === 3 && timeParts.length === 3) {
          label = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} às ${timeParts[0]}:${timeParts[1]}`;
          if (topicStr) {
            label += ` - ${topicStr.replace(/-/g, ' ')}`;
          }
        }
      }
      return { label, value: path.join(SESSIONS_DIR, file) };
    });
  } catch (err) {
    return [];
  }
}

/**
 * Carrega as mensagens de um arquivo de sessão.
 */
export async function loadSession(filepath: string): Promise<Message[]> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as Message[];
  } catch (err) {
    return [];
  }
}

/**
 * Define manualmente o arquivo de sessão atual (para continuar uma sessão antiga).
 */
export function setCurrentSession(filepath: string): void {
  currentSessionFile = filepath;
}
