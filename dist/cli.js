#!/usr/bin/env node

// src/cli.ts
import { execSync as execSync2 } from "node:child_process";
import fs9 from "node:fs/promises";
import os4 from "node:os";
import path6 from "node:path";
import readline from "node:readline";
import pc3 from "picocolors";

// src/repl.tsx
import React2 from "react";
import { render } from "ink";

// src/App.tsx
import React, { useState } from "react";
import { Box, Text, useApp, useInput, Static } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import figlet from "figlet";
import pc from "picocolors";
import gradient from "gradient-string";

// src/llm.ts
import OpenAI from "openai";

// src/providers.ts
var PROVIDERS = [
  {
    name: "groq",
    label: "Groq (Ultrarr\xE1pido \u2022 Llama 3.3)",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    requiresKey: !0
  },
  {
    name: "openrouter",
    label: "OpenRouter (200+ modelos)",
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-2.5-flash",
    requiresKey: !0
  },
  {
    name: "gemini",
    label: "Google Gemini (Gratuito \u2022 Contexto longo)",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
    requiresKey: !0
  },
  {
    name: "deepseek",
    label: "DeepSeek (V3 / R1 \u2022 Custo baixo)",
    baseURL: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    requiresKey: !0
  },
  {
    name: "openai",
    label: "OpenAI (GPT-4o)",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    requiresKey: !0
  },
  {
    name: "mistral",
    label: "Mistral AI (Codestral / Large)",
    baseURL: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    requiresKey: !0
  },
  {
    name: "together",
    label: "Together AI (Open-source r\xE1pido)",
    baseURL: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    requiresKey: !0
  },
  {
    name: "ollama",
    label: "Ollama (Local / Offline)",
    baseURL: "http://localhost:11434/v1",
    defaultModel: "llama3.2",
    requiresKey: !1
  }
];

// src/llm.ts
var client = null;
function createClient(config) {
  let saved = config.providers[config.activeProvider];
  if (!saved)
    throw new Error(
      `Provedor "${config.activeProvider}" n\xE3o est\xE1 configurado. Use /provider para configurar.`
    );
  return client = new OpenAI({
    apiKey: saved.apiKey || "not-needed",
    baseURL: saved.baseURL
  }), client;
}
function getClient() {
  if (!client)
    throw new Error("Cliente LLM n\xE3o inicializado. Use /provider para configurar.");
  return client;
}

// src/system-prompt.ts
import os from "node:os";
function buildSystemPrompt() {
  let cwd = process.cwd(), homeDir = os.homedir(), platform = os.platform(), arch = os.arch();
  return `Voc\xEA \xE9 o OpenMux, um assistente de intelig\xEAncia artificial que roda diretamente no terminal do Termux em dispositivos Android.

## Ambiente Atual
- Diret\xF3rio atual: ${cwd}
- Diret\xF3rio home: ${homeDir}
- Plataforma: ${platform} / ${arch}

## Sobre o Termux
- O Termux \xE9 um emulador de terminal Linux para Android.
- O diret\xF3rio home fica em: /data/data/com.termux/files/home
- O prefixo do sistema (equivale a /usr) \xE9: /data/data/com.termux/files/usr
- Para instalar pacotes use: pkg install <pacote>  (ou apt install <pacote>)
- O armazenamento compartilhado do Android fica em: ~/storage/ (ap\xF3s rodar termux-setup-storage)
- O Termux N\xC3O tem acesso root por padr\xE3o.

## Suas Capacidades (Ferramentas Dispon\xEDveis)
Voc\xEA possui as seguintes ferramentas que pode usar para ajudar o usu\xE1rio:

1. **bash_command**: Executa comandos no terminal (SEMPRE ser\xE1 pedida confirma\xE7\xE3o ao usu\xE1rio antes de executar).
2. **create_file**: Cria novos arquivos com o conte\xFAdo especificado.
3. **read_file**: L\xEA o conte\xFAdo de arquivos existentes.
4. **edit_file**: Edita trechos espec\xEDficos de arquivos (substitui\xE7\xE3o cir\xFArgica de texto).
5. **delete_path**: Remove arquivos ou diret\xF3rios (com confirma\xE7\xE3o do usu\xE1rio).
6. **create_directory**: Cria diret\xF3rios (incluindo diret\xF3rios pais).
7. **list_directory**: Lista arquivos e pastas de um diret\xF3rio.
8. **ask_user**: Faz uma pergunta ao usu\xE1rio quando h\xE1 ambiguidade ou decis\xE3o necess\xE1ria.

## Regras de Comportamento
- Responda SEMPRE em portugu\xEAs brasileiro.
- Seja conciso e direto nas respostas.
- Ao executar comandos, explique brevemente o motivo antes de chamar a ferramenta.
- CR\xCDTICO PARA MARKDOWN: SEMPRE use crases triplas (\`\`\`) para formatar blocos de c\xF3digo. NUNCA crie blocos de c\xF3digo usando indenta\xE7\xE3o (4 espa\xE7os).
- CR\xCDTICO PARA MARKDOWN: SEMPRE alinhe listas encostadas na margem esquerda (n\xE3o coloque espa\xE7os antes de '*' ou '-'), para evitar problemas de renderiza\xE7\xE3o no terminal.
- Se n\xE3o souber algo ou a tarefa for arriscada, pergunte ao usu\xE1rio usando a ferramenta ask_user.
- Nunca execute comandos destrutivos sem antes explicar o que ser\xE1 feito.
- Prefira solu\xE7\xF5es leves e otimizadas para dispositivos m\xF3veis.
`;
}

// src/tools/bash-command.ts
import { execSync } from "node:child_process";
var TIMEOUT_MS = 3e4, bashCommandTool = {
  definition: {
    type: "function",
    function: {
      name: "bash_command",
      description: "Executa um comando no terminal/shell. O usu\xE1rio SEMPRE ser\xE1 consultado.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
          reason: { type: "string" }
        },
        required: ["command", "reason"]
      }
    }
  },
  handler: async (args, ctx) => {
    let command = args.command, reason = args.reason, choice;
    if (ctx.selectUser ? choice = await ctx.selectUser(`Executar comando: ${command}
Motivo: ${reason}
Selecione uma a\xE7\xE3o:`, [
      { label: "Sim, executar o comando", value: "s" },
      { label: "N\xE3o, rejeitar o comando", value: "n" },
      { label: "Editar o comando", value: "e" }
    ]) : choice = (await ctx.askUser(`Executar comando: ${command}
Motivo: ${reason}
Autorizar? [s]im / [n]\xE3o / [e]ditar:`)).trim().toLowerCase(), choice === "n" || choice.startsWith("n\xE3") || choice.startsWith("na"))
      return "O usu\xE1rio REJEITOU a execu\xE7\xE3o deste comando.";
    let finalCommand = command;
    (choice === "e" || choice.startsWith("ed")) && (finalCommand = await ctx.askUser("Digite o comando editado:"));
    try {
      return `Comando executado com sucesso.

Sa\xEDda:
${execSync(finalCommand, {
        encoding: "utf-8",
        timeout: TIMEOUT_MS,
        maxBuffer: 1048576,
        cwd: process.cwd()
      }).trim() || "(comando executado sem sa\xEDda)"}`;
    } catch (error) {
      let err = error, stderr = err.stderr || err.message || "Erro desconhecido";
      return `Erro ao executar o comando (c\xF3digo de sa\xEDda: ${err.status || "?"}).

Sa\xEDda de erro:
${stderr}`;
    }
  }
};

// src/tools/create-file.ts
import fs from "node:fs/promises";
import path2 from "node:path";

// src/security.ts
import path from "node:path";
async function validatePathAccess(targetPath, ctx) {
  let cwd = process.cwd(), resolved = path.resolve(targetPath);
  return resolved.startsWith(cwd + path.sep) || resolved === cwd ? !0 : (await ctx.askUser(`ATEN\xC7\xC3O: A ferramenta quer acessar fora da pasta atual:
  Alvo: ${resolved}
  CWD: ${cwd}
Autorizar acesso? [s]im / [n]\xE3o:`)).trim().toLowerCase().startsWith("s");
}
function accessDeniedMessage(targetPath) {
  return `O usu\xE1rio NEGOU acesso ao caminho "${targetPath}" que est\xE1 fora do diret\xF3rio de trabalho atual. Use caminhos dentro do diret\xF3rio atual ou pe\xE7a permiss\xE3o ao usu\xE1rio com ask_user antes de tentar novamente.`;
}

// src/tools/create-file.ts
var createFileTool = {
  definition: {
    type: "function",
    function: {
      name: "create_file",
      description: "Cria um novo arquivo com o conte\xFAdo especificado. Diret\xF3rios pais s\xE3o criados automaticamente se n\xE3o existirem.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: 'Caminho completo do arquivo a ser criado (ex: "./src/index.js")'
          },
          content: {
            type: "string",
            description: "Conte\xFAdo completo do arquivo"
          }
        },
        required: ["filePath", "content"]
      }
    }
  },
  handler: async (args, ctx) => {
    let filePath = args.filePath, content = args.content;
    if (!await validatePathAccess(filePath, ctx))
      return accessDeniedMessage(filePath);
    try {
      let dir = path2.dirname(filePath);
      await fs.mkdir(dir, { recursive: !0 }), await fs.writeFile(filePath, content, "utf-8");
      let size = Buffer.byteLength(content, "utf-8");
      return `Arquivo criado com sucesso: ${filePath} (${size} bytes)`;
    } catch (error) {
      return `Erro ao criar arquivo: ${error.message}`;
    }
  }
};

// src/tools/read-file.ts
import fs2 from "node:fs/promises";
var readFileTool = {
  definition: {
    type: "function",
    function: {
      name: "read_file",
      description: "L\xEA o conte\xFAdo de um arquivo. Pode ler o arquivo inteiro ou um intervalo espec\xEDfico de linhas.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Caminho do arquivo a ser lido"
          },
          startLine: {
            type: "number",
            description: "Linha inicial (1-indexed, opcional). Se omitido, l\xEA do in\xEDcio."
          },
          endLine: {
            type: "number",
            description: "Linha final (1-indexed, inclusiva, opcional). Se omitido, l\xEA at\xE9 o fim."
          }
        },
        required: ["filePath"]
      }
    }
  },
  handler: async (args, ctx) => {
    let filePath = args.filePath, startLine = args.startLine, endLine = args.endLine;
    if (!await validatePathAccess(filePath, ctx))
      return accessDeniedMessage(filePath);
    try {
      let lines = (await fs2.readFile(filePath, "utf-8")).split(`
`), start = startLine ? startLine - 1 : 0, end = endLine || lines.length, selectedLines = lines.slice(start, end), totalLines = lines.length, showing = selectedLines.length, numbered = selectedLines.map((line, i) => `${start + i + 1}: ${line}`).join(`
`);
      return `Conte\xFAdo de ${filePath} (linhas ${start + 1}-${start + showing} de ${totalLines}):

${numbered}`;
    } catch (error) {
      return `Erro ao ler arquivo: ${error.message}`;
    }
  }
};

// src/tools/edit-file.ts
import fs3 from "node:fs/promises";
var editFileTool = {
  definition: {
    type: "function",
    function: {
      name: "edit_file",
      description: 'Edita um arquivo existente substituindo um trecho de texto por outro. Busca o "oldText" exato no arquivo e substitui pelo "newText". Ideal para modifica\xE7\xF5es cir\xFArgicas sem reescrever o arquivo inteiro.',
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Caminho do arquivo a ser editado"
          },
          oldText: {
            type: "string",
            description: "Texto exato a ser encontrado e substitu\xEDdo (deve ser \xFAnico no arquivo)"
          },
          newText: {
            type: "string",
            description: "Novo texto que substituir\xE1 o oldText"
          }
        },
        required: ["filePath", "oldText", "newText"]
      }
    }
  },
  handler: async (args, ctx) => {
    let filePath = args.filePath, oldText = args.oldText, newText = args.newText;
    if (!await validatePathAccess(filePath, ctx))
      return accessDeniedMessage(filePath);
    try {
      let content = await fs3.readFile(filePath, "utf-8"), occurrences = content.split(oldText).length - 1;
      if (occurrences === 0)
        return `Erro: O trecho de texto especificado em "oldText" N\xC3O foi encontrado no arquivo ${filePath}. Verifique se o texto est\xE1 exatamente correto (incluindo espa\xE7os e quebras de linha).`;
      if (occurrences > 1)
        return `Erro: O trecho de texto foi encontrado ${occurrences} vezes no arquivo. O oldText precisa ser \xFAnico. Inclua mais contexto (linhas ao redor) para torn\xE1-lo \xFAnico.`;
      let newContent = content.replace(oldText, newText);
      return await fs3.writeFile(filePath, newContent, "utf-8"), `Arquivo editado com sucesso: ${filePath}`;
    } catch (error) {
      return `Erro ao editar arquivo: ${error.message}`;
    }
  }
};

// src/tools/delete-path.ts
import fs4 from "node:fs/promises";
var deletePathTool = {
  definition: {
    type: "function",
    function: {
      name: "delete_path",
      description: "Remove um arquivo ou diret\xF3rio.",
      parameters: {
        type: "object",
        properties: {
          targetPath: { type: "string" },
          recursive: { type: "boolean" }
        },
        required: ["targetPath"]
      }
    }
  },
  handler: async (args, ctx) => {
    let targetPath = args.targetPath, recursive = args.recursive ?? !1;
    if (!await validatePathAccess(targetPath, ctx))
      return accessDeniedMessage(targetPath);
    try {
      let isDir = (await fs4.stat(targetPath)).isDirectory(), ans;
      return ctx.selectUser ? ans = await ctx.selectUser(`Deletar ${isDir ? "diret\xF3rio" : "arquivo"}: ${targetPath}
Tem certeza?`, [
        { label: "Sim, excluir", value: "s" },
        { label: "N\xE3o, cancelar", value: "n" }
      ]) : ans = await ctx.askUser(`Deletar ${isDir ? "diret\xF3rio" : "arquivo"}: ${targetPath}
Tem certeza? [s]im / [n]\xE3o:`), ans.trim().toLowerCase().startsWith("s") ? (isDir ? await fs4.rm(targetPath, { recursive, force: !0 }) : await fs4.unlink(targetPath), `Removido com sucesso: ${targetPath}`) : "O usu\xE1rio CANCELOU a exclus\xE3o.";
    } catch (error) {
      return `Erro ao remover: ${error.message}`;
    }
  }
};

// src/tools/create-directory.ts
import fs5 from "node:fs/promises";
var createDirectoryTool = {
  definition: {
    type: "function",
    function: {
      name: "create_directory",
      description: "Cria um novo diret\xF3rio. Se os diret\xF3rios pais n\xE3o existirem, eles s\xE3o criados automaticamente (equivalente a mkdir -p).",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: 'Caminho do diret\xF3rio a ser criado (ex: "./src/components")'
          }
        },
        required: ["dirPath"]
      }
    }
  },
  handler: async (args, ctx) => {
    let dirPath = args.dirPath;
    if (!await validatePathAccess(dirPath, ctx))
      return accessDeniedMessage(dirPath);
    try {
      return await fs5.mkdir(dirPath, { recursive: !0 }), `Diret\xF3rio criado com sucesso: ${dirPath}`;
    } catch (error) {
      return `Erro ao criar diret\xF3rio: ${error.message}`;
    }
  }
};

// src/tools/list-directory.ts
import fs6 from "node:fs/promises";
import path3 from "node:path";
var listDirectoryTool = {
  definition: {
    type: "function",
    function: {
      name: "list_directory",
      description: "Lista os arquivos e subdiret\xF3rios de um diret\xF3rio especificado, incluindo tipo (arquivo/pasta) e tamanho.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: 'Caminho do diret\xF3rio a ser listado (ex: "." para o diret\xF3rio atual)'
          }
        },
        required: ["dirPath"]
      }
    }
  },
  handler: async (args, ctx) => {
    let dirPath = args.dirPath;
    if (!await validatePathAccess(dirPath, ctx))
      return accessDeniedMessage(dirPath);
    try {
      let entries = await fs6.readdir(dirPath, { withFileTypes: !0 });
      if (entries.length === 0)
        return `O diret\xF3rio ${dirPath} est\xE1 vazio.`;
      let lines = [];
      for (let entry of entries) {
        let fullPath = path3.join(dirPath, entry.name), type = entry.isDirectory() ? "\u{1F4C1}" : "\u{1F4C4}";
        if (entry.isFile())
          try {
            let sizeKB = ((await fs6.stat(fullPath)).size / 1024).toFixed(1);
            lines.push(`${type} ${entry.name}  (${sizeKB} KB)`);
          } catch {
            lines.push(`${type} ${entry.name}`);
          }
        else
          lines.push(`${type} ${entry.name}/`);
      }
      return `Conte\xFAdo de ${dirPath}:

${lines.join(`
`)}`;
    } catch (error) {
      return `Erro ao listar diret\xF3rio: ${error.message}`;
    }
  }
};

// src/tools/ask-user.ts
var askUserTool = {
  definition: {
    type: "function",
    function: {
      name: "ask_user",
      description: "Faz uma pergunta ao usu\xE1rio. Use quando precisar de informa\xE7\xF5es, esclarecer ambiguidades, ou perguntar o que fazer a seguir.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "A pergunta a ser feita ao usu\xE1rio"
          }
        },
        required: ["question"]
      }
    }
  },
  handler: async (args, ctx) => {
    let question = args.question;
    try {
      return `Resposta do usu\xE1rio: ${await ctx.askUser(question)}`;
    } catch (error) {
      return `Erro ao perguntar ao usu\xE1rio: ${error.message}`;
    }
  }
};

// src/tools/index.ts
var ALL_TOOLS = [
  bashCommandTool,
  createFileTool,
  readFileTool,
  editFileTool,
  deletePathTool,
  createDirectoryTool,
  listDirectoryTool,
  askUserTool
];
function getToolDefinitions() {
  return ALL_TOOLS.map((t) => t.definition);
}
function getToolHandler(name) {
  return ALL_TOOLS.find(
    (t) => t.definition.function.name === name
  )?.handler;
}

// src/agent.ts
async function runAgentLoop(messages, config, onStream, onTool, onPrompt, onToolSelect, onUpdate, onFinish) {
  let client2 = getClient(), toolDefs = getToolDefinitions();
  for (; ; )
    try {
      let stream = await client2.chat.completions.create({
        model: config.activeModel,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...messages
        ],
        tools: toolDefs,
        stream: !0
      }), fullContent = "", toolCalls = [];
      for await (let chunk of stream) {
        let choice = chunk.choices[0];
        if (!choice) continue;
        let delta = choice.delta;
        if (delta?.content && (fullContent += delta.content, onStream(delta.content)), delta?.tool_calls)
          for (let tc of delta.tool_calls)
            toolCalls[tc.index] || (toolCalls[tc.index] = { id: "", name: "", arguments: "" }), tc.id && (toolCalls[tc.index].id = tc.id), tc.function?.name && (toolCalls[tc.index].name = tc.function.name, onTool(`${tc.function.name} [gerando par\xE2metros...]`)), tc.function?.arguments && (toolCalls[tc.index].arguments += tc.function.arguments);
      }
      if (toolCalls.length === 0) {
        fullContent && messages.push({ role: "assistant", content: fullContent }), onFinish(messages);
        break;
      }
      messages.push({
        role: "assistant",
        content: fullContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: tc.arguments
          }
        }))
      }), onUpdate(messages);
      for (let tc of toolCalls) {
        let args;
        try {
          args = JSON.parse(tc.arguments);
        } catch {
          args = {};
        }
        onTool(tc.name);
        let handler = getToolHandler(tc.name), result, ctx = { askUser: onPrompt, selectUser: onToolSelect };
        if (handler)
          try {
            result = await handler(args, ctx);
          } catch (error) {
            result = `Erro interno ao executar a ferramenta: ${error.message}`;
          }
        else
          result = `Erro: Ferramenta "${tc.name}" n\xE3o encontrada.`;
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result
        }), onUpdate(messages);
      }
    } catch (error) {
      throw error;
    }
}

// src/config.ts
import fs7 from "node:fs/promises";
import path4 from "node:path";
import os2 from "node:os";
var CONFIG_DIR = path4.join(os2.homedir(), ".openmux"), CONFIG_FILE = path4.join(CONFIG_DIR, "config.json");
function getDefaultConfig() {
  return {
    activeProvider: "",
    activeModel: "",
    providers: {}
  };
}
async function loadConfig() {
  try {
    let data = await fs7.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return getDefaultConfig();
  }
}
async function saveConfig(config) {
  await fs7.mkdir(CONFIG_DIR, { recursive: !0 }), await fs7.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
function getConfigDir() {
  return CONFIG_DIR;
}

// src/session.ts
import fs8 from "node:fs/promises";
import path5 from "node:path";
import os3 from "node:os";
var SESSIONS_DIR = path5.join(os3.homedir(), ".openmux", "sessions"), currentSessionFile = "";
async function initSession(firstPrompt) {
  await fs8.mkdir(SESSIONS_DIR, { recursive: !0 });
  let timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/T/, "_").replace(/[:.]/g, "-").slice(0, 19), topic = "";
  firstPrompt && (topic = "_" + firstPrompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase()), currentSessionFile = path5.join(SESSIONS_DIR, `session_${timestamp}${topic}.json`);
}
async function saveSession(messages) {
  let userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length !== 0) {
    currentSessionFile || await initSession(userMessages[0]?.content);
    try {
      await fs8.writeFile(currentSessionFile, JSON.stringify(messages, null, 2), "utf-8");
    } catch {
    }
  }
}
async function getRecentSessions(limit = 4) {
  try {
    let jsonFiles = (await fs8.readdir(SESSIONS_DIR)).filter((f) => f.endsWith(".json"));
    return jsonFiles.sort((a, b) => b.localeCompare(a)), jsonFiles.slice(0, limit).map((file) => {
      let match = file.match(/session_([0-9-]{10})_([0-9-]{8})(?:_(.*))?\.json/), label = file;
      if (match) {
        let dateStr = match[1], timeStr = match[2], topicStr = match[3], dateParts = dateStr.split("-"), timeParts = timeStr.split("-");
        dateParts.length === 3 && timeParts.length === 3 && (label = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} \xE0s ${timeParts[0]}:${timeParts[1]}`, topicStr && (label += ` - ${topicStr.replace(/-/g, " ")}`));
      }
      return { label, value: path5.join(SESSIONS_DIR, file) };
    });
  } catch {
    return [];
  }
}
async function loadSession(filepath) {
  try {
    let content = await fs8.readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}
function setCurrentSession(filepath) {
  currentSessionFile = filepath;
}

// src/App.tsx
marked.use(markedTerminal({
  showSectionPrefix: !1,
  // Esconde os "##" nos títulos
  tab: 2
  // Menos espaçamento nas listas
}));
marked.use({
  renderer: {
    text(token) {
      return typeof token == "object" && token.tokens ? this.parser.parseInline(token.tokens) : typeof token == "object" ? token.text : token;
    }
  }
});
function App({ initialConfig }) {
  let { exit } = useApp(), [config, setConfig] = useState(initialConfig), [uiState, setUiState] = useState("chat"), [input, setInput] = useState(""), [messages, setMessages] = useState([]), [sessionOptions, setSessionOptions] = useState([]), [promptData, setPromptData] = useState(null), [promptInput, setPromptInput] = useState(""), [toolSelectData, setToolSelectData] = useState(null);
  React.useEffect(() => {
    messages.length > 0 && saveSession(messages);
  }, [messages]);
  let [isThinking, setIsThinking] = useState(!1), [streamingText, setStreamingText] = useState(""), [activeTool, setActiveTool] = useState(""), [sessionKey, setSessionKey] = useState(0), [selectedProvider, setSelectedProvider] = useState(""), [apiKeyInput, setApiKeyInput] = useState(""), [modelInput, setModelInput] = useState("");
  useInput((ch, key) => {
    key.ctrl && ch === "c" && exit(), key.escape && uiState !== "chat" && uiState !== "tool-prompt" && uiState !== "tool-select" && (setUiState("chat"), uiState === "commands" && setInput(""));
  });
  let handleChatChange = (value) => {
    setInput(value), value === "/" && setUiState("commands");
  }, handleChatSubmit = async (value) => {
    let trimmed = value.trim();
    if (!trimmed) return;
    let newMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages), setInput(""), setIsThinking(!0);
    try {
      await runAgentLoop(
        newMessages,
        config,
        (chunk) => setStreamingText((prev) => prev + chunk),
        (toolName) => setActiveTool(toolName),
        (msg) => new Promise((resolve) => {
          setPromptData({ msg, resolve }), setUiState("tool-prompt");
        }),
        (msg, options) => new Promise((resolve) => {
          setToolSelectData({ msg, options, resolve }), setUiState("tool-select");
        }),
        (updatedMessages) => {
          setMessages([...updatedMessages]), setStreamingText(""), setActiveTool("");
        },
        (finalMessages) => {
          setMessages([...finalMessages]), setStreamingText(""), setActiveTool("");
        }
      );
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: `\u274C Erro: ${e.message}` }]);
    } finally {
      setIsThinking(!1), setStreamingText(""), setActiveTool(""), setUiState("chat");
    }
  }, handleCommandSelect = async (item) => {
    if (item.value === "provider" && setUiState("providers"), item.value === "model" && (setModelInput(config.activeModel || ""), setUiState("model")), item.value === "clear" && (setMessages([]), setSessionKey((k) => k + 1), setUiState("chat")), item.value === "session") {
      let sessions = await getRecentSessions(4);
      sessions.length === 0 ? setMessages((m) => [...m, { role: "system", content: "Nenhuma sess\xE3o antiga encontrada." }]) : (setSessionOptions(sessions), setUiState("sessions"));
    }
    item.value === "exit" && exit();
  }, applyProviderChange = async (providerName, apiKey) => {
    let provInfo = PROVIDERS.find((p) => p.name === providerName);
    if (!provInfo) return;
    let newConfig = { ...config };
    newConfig.activeProvider = providerName, newConfig.activeModel = provInfo.defaultModel, newConfig.providers || (newConfig.providers = {}), newConfig.providers[providerName] = {
      apiKey: apiKey || newConfig.providers[providerName]?.apiKey || "",
      baseURL: provInfo.baseURL
    }, setConfig(newConfig), await saveConfig(newConfig), createClient(newConfig), setUiState("chat"), setMessages((m) => [...m, { role: "assistant", content: `\u2705 Provedor alterado para ${provInfo.label} e modelo para ${provInfo.defaultModel}.` }]);
  }, handleProviderSelect = (item) => {
    let providerName = item.value;
    setSelectedProvider(providerName), PROVIDERS.find((p) => p.name === providerName)?.requiresKey ? (setApiKeyInput(""), setUiState("apikey")) : applyProviderChange(providerName, "");
  }, handleApiKeySubmit = () => {
    applyProviderChange(selectedProvider, apiKeyInput);
  }, handleModelSubmit = async () => {
    let newConfig = { ...config, activeModel: modelInput };
    setConfig(newConfig), await saveConfig(newConfig), setUiState("chat"), setMessages((m) => [...m, { role: "assistant", content: `[ Sistema ]: Modelo alterado para ${modelInput}.` }]);
  }, staticItems = [
    { role: "header", content: "" },
    ...messages
  ];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Static, { key: sessionKey, items: staticItems }, (msg, idx) => {
    if (msg.role === "header") {
      let cwd = process.cwd(), cols = process.stdout?.columns || 80, maxCwdLen = Math.max(10, cols - 15), displayCwd = cwd.length > maxCwdLen ? cwd.substring(0, Math.floor(maxCwdLen / 2) - 3) + "..." + cwd.substring(cwd.length - Math.floor(maxCwdLen / 2)) : cwd, isVerySmall = cols < 50, isSmallScreen = cols < 70, robotArt = `  \u2584\u2588\u2588\u2588\u2588\u2588\u2588\u2584 
 \u2588\u2588\u2588\u2580\u2588\u2588\u2580\u2588\u2588\u2588
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
 \u2588\u2588\u2584\u2580\u2580\u2580\u2580\u2584\u2588\u2588
  \u2580\u2588\u2588\u2588\u2588\u2588\u2588\u2580 `, fontToUse = "Slant";
      isVerySmall ? fontToUse = "Mini" : isSmallScreen && (fontToUse = "Small Slant");
      let logoArt = figlet.textSync("OpenMux", { font: fontToUse }), coloredRobot = gradient(["#4facfe", "#f093fb"]).multiline(robotArt), coloredLogo = gradient(["#4facfe", "#f093fb"]).multiline(logoArt), lineWidth = Math.max(20, Math.min(cols - 2, 60)), coloredLine = gradient(["#4facfe", "#f093fb"])("\u2501".repeat(lineWidth));
      return /* @__PURE__ */ React.createElement(Box, { key: "header", width: cols, alignItems: "center", flexDirection: "column", marginBottom: 1, paddingY: 1 }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", alignItems: "center", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Box, { marginRight: 1 }, /* @__PURE__ */ React.createElement(Text, null, coloredRobot)), /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, null, coloredLogo))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", paddingY: 0 }, /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "Model: ", config.activeProvider || "None", " \u2022 ", /* @__PURE__ */ React.createElement(Text, { color: "blue" }, config.activeModel || "None")), /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "Directory: ", displayCwd)), /* @__PURE__ */ React.createElement(Text, null, coloredLine));
    }
    if (msg.role === "user")
      return /* @__PURE__ */ React.createElement(Box, { key: idx, paddingBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "blue", bold: !0 }, "\u276F "), /* @__PURE__ */ React.createElement(Text, { color: "blue" }, msg.content));
    if (msg.role === "assistant") {
      let hasContent = !!msg.content, toolCalls = msg.tool_calls || [], safeContent = typeof msg.content == "string" ? msg.content.replace(/^ {4}(\*|-|\+ |\d+\. )/gm, "$1") : "", renderedOutput = marked.parse(safeContent).trim();
      return renderedOutput = renderedOutput.replace(/^( *)\* /gm, "$1\u2022 "), /* @__PURE__ */ React.createElement(Box, { key: idx, flexDirection: "column", paddingBottom: 1 }, hasContent && /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, null, renderedOutput)));
    }
    if (msg.role === "tool") {
      if (!!!msg.content) return /* @__PURE__ */ React.createElement(Box, { key: idx });
      let tc = staticItems.find((m) => m.role === "assistant" && m.tool_calls?.some((t) => t.id === msg.tool_call_id))?.tool_calls?.find((t) => t.id === msg.tool_call_id);
      if (!tc) return /* @__PURE__ */ React.createElement(Box, { key: idx });
      let mainArg = "", codeContent = "", codeLang = "";
      try {
        let args = JSON.parse(tc.function.arguments);
        if (tc.function.name === "bash_command" || tc.function.name === "bash-command")
          mainArg = args.command;
        else if (tc.function.name === "ask_user" || tc.function.name === "ask-user")
          mainArg = args.question;
        else if (tc.function.name === "file_manager" || tc.function.name === "file-manager")
          mainArg = `${args.action} ${args.path || ""} ${args.destination || ""}`.trim();
        else if (tc.function.name === "create_file") {
          mainArg = args.filePath || "", codeContent = args.content || "";
          let extMatch = mainArg.match(/\.([a-z0-9]+)$/i);
          codeLang = extMatch ? extMatch[1] : "";
        } else if (tc.function.name === "edit_file") {
          mainArg = args.filePath || "", codeContent = `// --- SUBSTITUINDO ISSO ---
${args.oldText || ""}

// --- POR ISSO ---
${args.newText || ""}`;
          let extMatch = mainArg.match(/\.([a-z0-9]+)$/i);
          codeLang = extMatch ? extMatch[1] : "diff";
        } else tc.function.name === "read_file" ? mainArg = `${args.filePath || ""} ${args.startLine ? `(Linhas ${args.startLine}-${args.endLine || "fim"})` : ""}`.trim() : tc.function.name === "delete_path" ? mainArg = `${args.targetPath || ""} ${args.recursive ? "[Recursivo]" : ""}`.trim() : tc.function.name === "create_directory" || tc.function.name === "list_directory" ? mainArg = args.dirPath || "" : mainArg = JSON.stringify(args);
      } catch {
        mainArg = tc.function.arguments.replace(/\n/g, " "), mainArg.length > 100 && (mainArg = mainArg.substring(0, 100) + "...");
      }
      let cleanStr = (typeof msg.content == "string" ? msg.content : JSON.stringify(msg.content)).replace(/[\r\n]+/g, " \u21B5 ").replace(/\s+/g, " ").trim(), displayStr = cleanStr.length > 200 ? cleanStr.substring(0, 200) + "... (sa\xEDda longa)" : cleanStr;
      return /* @__PURE__ */ React.createElement(Box, { key: idx, flexDirection: "column", marginTop: 1 }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React.createElement(Text, { color: "green", bold: !0 }, "\u25CF "), /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, tc.function.name), mainArg && /* @__PURE__ */ React.createElement(Box, { paddingLeft: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "white", wrap: "truncate-end" }, mainArg))), codeContent && /* @__PURE__ */ React.createElement(Box, { paddingLeft: 2, marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, null, marked.parse(`\`\`\`${codeLang}
${codeContent}
\`\`\``).trim())), /* @__PURE__ */ React.createElement(Box, { paddingBottom: 1, paddingLeft: 2, flexDirection: "row" }, /* @__PURE__ */ React.createElement(Box, { marginRight: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "\u2514\u2500\u2500")), /* @__PURE__ */ React.createElement(Box, { flexShrink: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "gray", dimColor: !0, wrap: "truncate-end" }, displayStr))));
    }
    return /* @__PURE__ */ React.createElement(Box, { key: idx });
  }), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", paddingX: 1 }, streamingText && (() => {
    let renderedOutput = marked.parse(streamingText.replace(/^ {4}(\*|-|\+ |\d+\. )/gm, "$1")).trim().replace(/^( *)\* /gm, "$1\u2022 "), lines = renderedOutput.split(`
`), maxLines = Math.max(10, (process.stdout?.rows || 24) - 12), displayOutput = lines.length > maxLines ? `...
` + lines.slice(lines.length - maxLines).join(`
`) : renderedOutput;
    return /* @__PURE__ */ React.createElement(Box, { paddingBottom: 1 }, /* @__PURE__ */ React.createElement(Text, null, displayOutput));
  })(), activeTool && uiState !== "tool-prompt" && uiState !== "tool-select" && /* @__PURE__ */ React.createElement(Box, { flexDirection: "row" }, /* @__PURE__ */ React.createElement(Text, { color: "green", bold: !0 }, "\u25CF "), /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, activeTool, " "), /* @__PURE__ */ React.createElement(Text, { color: "gray" }, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), " processando...")), isThinking && !streamingText && !activeTool && uiState !== "tool-prompt" && uiState !== "tool-select" && /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, /* @__PURE__ */ React.createElement(Spinner, { type: "dots" }), " Pensando...")), uiState === "tool-select" && toolSelectData && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, toolSelectData.msg), /* @__PURE__ */ React.createElement(
    SelectInput,
    {
      items: toolSelectData.options,
      onSelect: (item) => {
        let res = toolSelectData.resolve;
        setToolSelectData(null), setUiState("chat"), res(item.value);
      }
    }
  )), uiState === "tool-prompt" && promptData && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, promptData.msg), /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, { color: "green", bold: !0 }, "\u276F "), /* @__PURE__ */ React.createElement(TextInput, { value: promptInput, onChange: setPromptInput, onSubmit: (val) => {
    let res = promptData.resolve;
    setPromptData(null), setPromptInput(""), setUiState("chat"), res(val);
  } }))), uiState === "commands" && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, "Comandos Dispon\xEDveis (Esc para cancelar):"), /* @__PURE__ */ React.createElement(
    SelectInput,
    {
      items: [
        { label: "/provider - Trocar provedor de IA", value: "provider" },
        { label: "/model - Trocar modelo", value: "model" },
        { label: "/session - Carregar sess\xE3o anterior", value: "session" },
        { label: "/clear - Limpar hist\xF3rico", value: "clear" },
        { label: "/exit - Sair do agente", value: "exit" }
      ],
      onSelect: handleCommandSelect
    }
  )), uiState === "sessions" && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, "Selecione uma sess\xE3o (Esc para cancelar):"), /* @__PURE__ */ React.createElement(
    SelectInput,
    {
      items: sessionOptions,
      onSelect: async (item) => {
        let msgs = await loadSession(item.value);
        setCurrentSession(item.value), setMessages(msgs), setSessionKey((k) => k + 1), setUiState("chat");
      }
    }
  )), uiState === "providers" && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, "Selecione o provedor (Esc para cancelar):"), /* @__PURE__ */ React.createElement(
    SelectInput,
    {
      items: PROVIDERS.map((p) => ({ label: `${config.providers?.[p.name]?.apiKey ? pc.green("\u2714 ") : "  "}${p.label}`, value: p.name })),
      onSelect: handleProviderSelect
    }
  )), uiState === "apikey" && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, "API Key para ", selectedProvider, " (Enter para salvar): "), config.providers?.[selectedProvider]?.apiKey && /* @__PURE__ */ React.createElement(Text, { color: "gray" }, "Esse provedor j\xE1 possui uma chave salva. Digite uma nova para substituir, ou apenas aperte Enter para manter a atual e conectar."), /* @__PURE__ */ React.createElement(TextInput, { value: apiKeyInput, onChange: setApiKeyInput, onSubmit: handleApiKeySubmit })), uiState === "model" && /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow", bold: !0 }, "Nome do Modelo (Enter para salvar, Esc para cancelar): "), /* @__PURE__ */ React.createElement(TextInput, { value: modelInput, onChange: setModelInput, onSubmit: handleModelSubmit })), /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderLeft: !1, borderRight: !1, borderColor: "gray", paddingX: 1, flexDirection: "column" }, /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Text, { color: "green", bold: !0 }, "\u276F "), uiState === "chat" ? /* @__PURE__ */ React.createElement(TextInput, { value: input, onChange: handleChatChange, onSubmit: handleChatSubmit }) : /* @__PURE__ */ React.createElement(Text, null, input))));
}

// src/repl.tsx
import pc2 from "picocolors";
import figlet2 from "figlet";
async function startRepl() {
  let config = await loadConfig();
  if (config.activeProvider)
    try {
      createClient(config);
    } catch {
      console.log(pc2.yellow("[ Aviso ]: Erro ao conectar com o provedor. Use /provider."));
    }
  console.clear();
  let { waitUntilExit, clear } = render(/* @__PURE__ */ React2.createElement(App, { initialConfig: config }), { exitOnCtrlC: !1 });
  await waitUntilExit(), clear(), process.stdout.write("\x1Bc");
  let cols = process.stdout.columns || 80, fontToUse = "Slant";
  cols < 50 ? fontToUse = "Mini" : cols < 70 && (fontToUse = "Small Slant");
  let logo = figlet2.textSync("OpenMux", { font: fontToUse });
  console.log(pc2.cyan(logo)), console.log(pc2.green(`  Sess\xE3o encerrada com sucesso. At\xE9 a pr\xF3xima!
`)), process.exit(0);
}

// src/cli.ts
async function askConfirm(message, defaultVal = !1) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }), prompt = defaultVal ? "[Y/n]" : "[y/N]";
  return new Promise((resolve) => {
    rl.question(`${message} ${prompt} `, (answer) => {
      rl.close();
      let lower = answer.trim().toLowerCase();
      if (lower === "y" || lower === "yes" || lower === "s" || lower === "sim") return resolve(!0);
      if (lower === "n" || lower === "no" || lower === "nao" || lower === "n\xE3o") return resolve(!1);
      resolve(defaultVal);
    });
  });
}
var REPO_URL = "https://github.com/Yeager13fg/Openmux.git", PACKAGE_NAME = "openmux";
async function main() {
  switch (process.argv.slice(2)[0]?.toLowerCase()) {
    case "update":
      await handleUpdate();
      break;
    case "uninstall":
      await handleUninstall();
      break;
    default:
      await startRepl();
      break;
  }
}
async function handleUpdate() {
  console.log(pc3.cyan(`
\u{1F504} Atualizando OpenMux...
`));
  let tmpDir = path6.join(os4.tmpdir(), `openmux-update-${Date.now()}`);
  try {
    console.log(pc3.dim("\u{1F4E5} Baixando vers\xE3o mais recente...")), execSync2(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, {
      stdio: "pipe"
    }), console.log(pc3.dim("\u2699\uFE0F  Instalando atualiza\xE7\xE3o...")), execSync2("npm pack && npm install -g openmux-*.tgz", {
      cwd: tmpDir,
      stdio: "pipe"
    }), console.log(pc3.dim("\u{1F9F9} Limpando arquivos tempor\xE1rios...")), await fs9.rm(tmpDir, { recursive: !0, force: !0 }), console.log(pc3.green(`
\u2705 Atualiza\xE7\xE3o conclu\xEDda com sucesso!`)), console.log(pc3.dim(`   Reinicie o agente para usar a nova vers\xE3o.
`));
  } catch (error) {
    await fs9.rm(tmpDir, { recursive: !0, force: !0 }).catch(() => {
    });
    let msg = error.message;
    console.log(pc3.red(`
\u274C Erro na atualiza\xE7\xE3o: ${msg}`)), console.log(pc3.dim(`Verifique sua conex\xE3o com a internet e tente novamente.
`));
  }
}
async function handleUninstall() {
  if (console.log(pc3.red(`
\u{1F5D1}\uFE0F  Desinstala\xE7\xE3o do OpenMux
`)), !await askConfirm("Tem certeza que deseja desinstalar o openmux?", !1)) {
    console.log(pc3.dim(`
Desinstala\xE7\xE3o cancelada.
`));
    return;
  }
  let configDir = getConfigDir(), removeConfig = await askConfirm(`Deseja tamb\xE9m apagar as configura\xE7\xF5es e chaves salvas? (${configDir})`, !1);
  try {
    console.log(pc3.dim(`
\u2699\uFE0F  Removendo pacote global...`)), execSync2(`npm uninstall -g ${PACKAGE_NAME}`, { stdio: "pipe" }), removeConfig && (console.log(pc3.dim("\u{1F9F9} Removendo configura\xE7\xF5es...")), await fs9.rm(configDir, { recursive: !0, force: !0 })), console.log(pc3.green(`
\u2705 Desinstala\xE7\xE3o conclu\xEDda.`)), removeConfig || console.log(
      pc3.dim(`   Suas configura\xE7\xF5es foram mantidas em: ${configDir}`)
    ), console.log(pc3.dim(`   Obrigado por usar o OpenMux! \u{1F44B}
`));
  } catch (error) {
    let msg = error.message;
    console.log(pc3.red(`
\u274C Erro na desinstala\xE7\xE3o: ${msg}
`));
  }
}
main().catch((err) => {
  console.error(pc3.red("Erro fatal:"), err), process.exit(1);
});
