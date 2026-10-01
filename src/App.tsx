import React, { useState } from 'react';
import { Box, Text, useApp, useInput, Static } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import figlet from 'figlet';
import pc from 'picocolors';
import gradient from 'gradient-string';

marked.use(markedTerminal({
  showSectionPrefix: false, // Esconde os "##" nos títulos
  tab: 2 // Menos espaçamento nas listas
}) as any);

// PATCH: Corrige um bug do `marked-terminal` com o `marked` v12+ 
// onde ele falha em renderizar negritos/itálicos (** **) dentro de listas.
marked.use({
  renderer: {
    text(token: any) {
      if (typeof token === 'object' && token.tokens) {
        return this.parser.parseInline(token.tokens);
      }
      return typeof token === 'object' ? token.text : token;
    }
  }
});

import type { AppConfig, Message } from './types.js';
import { runAgentLoop } from './agent.js';
import { PROVIDERS } from './providers.js';
import { saveConfig } from './config.js';
import { createClient } from './llm.js';
import { saveSession, getRecentSessions, loadSession, setCurrentSession } from './session.js';

type UiState = 'chat' | 'commands' | 'providers' | 'apikey' | 'model' | 'tool-prompt' | 'sessions' | 'tool-select';

export function App({ initialConfig }: { initialConfig: AppConfig }) {
  const { exit } = useApp();
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [uiState, setUiState] = useState<UiState>('chat');

  // Estados do Chat
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionOptions, setSessionOptions] = useState<{label: string, value: string}[]>([]);

  // Estados dos Modais
  const [promptData, setPromptData] = useState<{ msg: string, resolve: (val: string) => void } | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [toolSelectData, setToolSelectData] = useState<{ msg: string, options: {label: string, value: string}[], resolve: (val: string) => void } | null>(null);

  // Salvar sessão sempre que houver novas mensagens
  React.useEffect(() => {
    if (messages.length > 0) {
      saveSession(messages);
    }
  }, [messages]);

  const [isThinking, setIsThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTool, setActiveTool] = useState('');
  
  // Chave para forçar o recarregamento do <Static> quando a sessão mudar ou for limpa
  const [sessionKey, setSessionKey] = useState(0);

  // Estados dos Modais
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');



  // Atalhos Globais (Ctrl+C e Esc)
  useInput((ch, key) => {
    if (key.ctrl && ch === 'c') {
      exit();
    }
    if (key.escape && uiState !== 'chat' && uiState !== 'tool-prompt' && uiState !== 'tool-select') {
      setUiState('chat');
      if (uiState === 'commands') setInput('');
    }
  });

  // Handler de Input Principal
  const handleChatChange = (value: string) => {
    setInput(value);
    if (value === '/') {
      setUiState('commands');
    }
  };

  const handleChatSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const newMessages = [...messages, { role: 'user', content: trimmed } as Message];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      await runAgentLoop(
        newMessages,
        config,
        (chunk) => setStreamingText((prev) => prev + chunk),
        (toolName) => setActiveTool(toolName),
        (msg) => {
          return new Promise((resolve) => {
            setPromptData({ msg, resolve });
            setUiState('tool-prompt');
          });
        },
        (msg, options) => {
          return new Promise((resolve) => {
            setToolSelectData({ msg, options, resolve });
            setUiState('tool-select');
          });
        },
        (updatedMessages) => {
          setMessages([...updatedMessages]);
          setStreamingText('');
          setActiveTool('');
        },
        (finalMessages) => {
          setMessages([...finalMessages]);
          setStreamingText('');
          setActiveTool('');
        }
      );
    } catch (e: any) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Erro: ${e.message}` }]);
    } finally {
      setIsThinking(false);
      setStreamingText('');
      setActiveTool('');
      setUiState('chat');
    }
  };

  // Handlers dos Modais
  const handleCommandSelect = async (item: any) => {
    if (item.value === 'provider') setUiState('providers');
    if (item.value === 'model') {
      setModelInput(config.activeModel || '');
      setUiState('model');
    }
    if (item.value === 'clear') {
      setMessages([]);
      setSessionKey(k => k + 1);
      setUiState('chat');
    }

    if (item.value === 'session') {
      const sessions = await getRecentSessions(4);
      if (sessions.length === 0) {
        setMessages(m => [...m, { role: 'system', content: 'Nenhuma sessão antiga encontrada.' } as Message]);
      } else {
        setSessionOptions(sessions);
        setUiState('sessions');
      }
    }
    if (item.value === 'exit') {
      exit();
    }
  };

  const applyProviderChange = async (providerName: string, apiKey: string) => {
    const provInfo = PROVIDERS.find(p => p.name === providerName);
    if (!provInfo) return;

    const newConfig = { ...config };
    newConfig.activeProvider = providerName;
    newConfig.activeModel = provInfo.defaultModel;

    if (!newConfig.providers) newConfig.providers = {};
    newConfig.providers[providerName] = {
      apiKey: apiKey || newConfig.providers[providerName]?.apiKey || '',
      baseURL: provInfo.baseURL
    };

    setConfig(newConfig);
    await saveConfig(newConfig);
    createClient(newConfig);
    setUiState('chat');
    setMessages(m => [...m, { role: 'assistant', content: `✅ Provedor alterado para ${provInfo.label} e modelo para ${provInfo.defaultModel}.` }]);
  };

  const handleProviderSelect = (item: any) => {
    const providerName = item.value;
    setSelectedProvider(providerName);
    const provInfo = PROVIDERS.find(p => p.name === providerName);

    if (provInfo?.requiresKey) {
      setApiKeyInput('');
      setUiState('apikey');
    } else {
      applyProviderChange(providerName, '');
    }
  };

  const handleApiKeySubmit = () => {
    applyProviderChange(selectedProvider, apiKeyInput);
  };

  const handleModelSubmit = async () => {
    const newConfig = { ...config, activeModel: modelInput };
    setConfig(newConfig);
    await saveConfig(newConfig);
    setUiState('chat');
    setMessages(m => [...m, { role: 'assistant', content: `[ Sistema ]: Modelo alterado para ${modelInput}.` }]);
  };

  const staticItems = [
    { role: 'header' as const, content: '' },
    ...messages
  ];

  return (
    <>
      <Static key={sessionKey} items={staticItems}>
        {(msg, idx) => {
          if (msg.role === 'header') {
            const cwd = process.cwd();
            const cols = process.stdout?.columns || 80;
            const maxCwdLen = Math.max(10, cols - 15);
            const displayCwd = cwd.length > maxCwdLen ? cwd.substring(0, Math.floor(maxCwdLen/2) - 3) + '...' + cwd.substring(cwd.length - Math.floor(maxCwdLen/2)) : cwd;
            const isVerySmall = cols < 50;
            const isSmallScreen = cols < 70;

            const robotArt = `  ▄██████▄ \n ███▀██▀███\n ██████████\n ██▄▀▀▀▀▄██\n  ▀██████▀ `;
            
            let fontToUse = 'Slant';
            if (isVerySmall) fontToUse = 'Mini';
            else if (isSmallScreen) fontToUse = 'Small Slant';

            const logoArt = figlet.textSync('OpenMux', { font: fontToUse as any });
            
            // Cores originais mantidas
            const coloredRobot = gradient(['#4facfe', '#f093fb']).multiline(robotArt);
            const coloredLogo = gradient(['#4facfe', '#f093fb']).multiline(logoArt);
            
            // Barra dinâmica que nunca quebra a tela
            const lineWidth = Math.max(20, Math.min(cols - 2, 60));
            const coloredLine = gradient(['#4facfe', '#f093fb'])('━'.repeat(lineWidth));

            return (
              <Box key="header" width={cols} alignItems="center" flexDirection="column" marginBottom={1} paddingY={1}>
                <Box flexDirection="row" alignItems="center" marginBottom={1}>
                  <Box marginRight={1}>
                    <Text>{coloredRobot}</Text>
                  </Box>
                  <Box>
                    <Text>{coloredLogo}</Text>
                  </Box>
                </Box>
                <Box flexDirection="column" alignItems="center" paddingY={0}>
                  <Text color="gray">
                    Model: {config.activeProvider || 'None'} • <Text color="blue">{config.activeModel || 'None'}</Text>
                  </Text>
                  <Text color="gray">Directory: {displayCwd}</Text>
                </Box>
                <Text>{coloredLine}</Text>
              </Box>
            );
          }
          if (msg.role === 'user') {
            return (
              <Box key={idx} paddingBottom={1}>
                <Text color="blue" bold>❯ </Text>
                <Text color="blue">{msg.content as string}</Text>
              </Box>
            );
          }
          if (msg.role === 'assistant') {
            const hasContent = !!msg.content;
            const toolCalls = (msg as any).tool_calls || [];
            
            // Sanitizador: Modelos as vezes indentam listas com 4 espaços, quebrando o Markdown
            let safeContent = typeof msg.content === 'string' 
                ? msg.content.replace(/^ {4}(\*|-|\+ |\d+\. )/gm, '$1') 
                : '';

            let renderedOutput = (marked.parse(safeContent) as string).trim();
            // Troca o asterisco padrão do marked-terminal por um bullet bonito
            renderedOutput = renderedOutput.replace(/^( *)\* /gm, '$1• ');

            return (
              <Box key={idx} flexDirection="column" paddingBottom={1}>
                {hasContent && (
                  <Box>
                    <Text>{renderedOutput}</Text>
                  </Box>
                )}

              </Box>
            );
          }
          if (msg.role === 'tool') {
            const hasContent = !!msg.content;
            if (!hasContent) return <Box key={idx} />;

            const parentMsg = staticItems.find(m => m.role === 'assistant' && (m as any).tool_calls?.some((t: any) => t.id === (msg as any).tool_call_id)) as any;
            const tc = parentMsg?.tool_calls?.find((t: any) => t.id === (msg as any).tool_call_id);
            if (!tc) return <Box key={idx} />;

            let mainArg = '';
            let codeContent = '';
            let codeLang = '';
            try {
              const args = JSON.parse(tc.function.arguments);
              if (tc.function.name === 'bash_command' || tc.function.name === 'bash-command') {
                mainArg = args.command;
              } else if (tc.function.name === 'ask_user' || tc.function.name === 'ask-user') {
                mainArg = args.question;
              } else if (tc.function.name === 'file_manager' || tc.function.name === 'file-manager') {
                mainArg = `${args.action} ${args.path || ''} ${args.destination || ''}`.trim();
              } else if (tc.function.name === 'create_file') {
                mainArg = args.filePath || '';
                codeContent = args.content || '';
                const extMatch = mainArg.match(/\.([a-z0-9]+)$/i);
                codeLang = extMatch ? extMatch[1] : '';
              } else if (tc.function.name === 'edit_file') {
                mainArg = args.filePath || '';
                codeContent = `// --- SUBSTITUINDO ISSO ---\n${args.oldText || ''}\n\n// --- POR ISSO ---\n${args.newText || ''}`;
                const extMatch = mainArg.match(/\.([a-z0-9]+)$/i);
                codeLang = extMatch ? extMatch[1] : 'diff';
              } else if (tc.function.name === 'read_file') {
                mainArg = `${args.filePath || ''} ${args.startLine ? `(Linhas ${args.startLine}-${args.endLine || 'fim'})` : ''}`.trim();
              } else if (tc.function.name === 'delete_path') {
                mainArg = `${args.targetPath || ''} ${args.recursive ? '[Recursivo]' : ''}`.trim();
              } else if (tc.function.name === 'create_directory' || tc.function.name === 'list_directory') {
                mainArg = args.dirPath || '';
              } else {
                mainArg = JSON.stringify(args);
              }
            } catch {
              mainArg = tc.function.arguments.replace(/\n/g, ' ');
              if (mainArg.length > 100) mainArg = mainArg.substring(0, 100) + '...';
            }

            let contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            const cleanStr = contentStr.replace(/[\r\n]+/g, ' ↵ ').replace(/\s+/g, ' ').trim();
            const displayStr = cleanStr.length > 200 ? cleanStr.substring(0, 200) + '... (saída longa)' : cleanStr;

            return (
              <Box key={idx} flexDirection="column" marginTop={1}>
                <Box flexDirection="row">
                  <Text color="green" bold>● </Text>
                  <Text color="yellow" bold>{tc.function.name}</Text>
                  {mainArg && (
                    <Box paddingLeft={1}>
                      <Text color="white" wrap="truncate-end">{mainArg}</Text>
                    </Box>
                  )}
                </Box>
                {codeContent && (
                  <Box paddingLeft={2} marginTop={1}>
                    <Text>{(marked.parse(`\`\`\`${codeLang}\n${codeContent}\n\`\`\``) as string).trim()}</Text>
                  </Box>
                )}
                <Box paddingBottom={1} paddingLeft={2} flexDirection="row">
                  <Box marginRight={1}><Text color="gray">└──</Text></Box>
                  <Box flexShrink={1}>
                    <Text color="gray" dimColor wrap="truncate-end">{displayStr}</Text>
                  </Box>
                </Box>
              </Box>
            );
          }
          return <Box key={idx} />;
        }}
      </Static>

      <Box flexDirection="column" paddingX={1}>
        {streamingText && (() => {
            const renderedOutput = (marked.parse(streamingText.replace(/^ {4}(\*|-|\+ |\d+\. )/gm, '$1')) as string)
                .trim()
                .replace(/^( *)\* /gm, '$1• ');
            
            const lines = renderedOutput.split('\n');
            const maxLines = Math.max(10, (process.stdout?.rows || 24) - 12);
            const displayOutput = lines.length > maxLines 
                ? '...\n' + lines.slice(lines.length - maxLines).join('\n') 
                : renderedOutput;

            return (
              <Box paddingBottom={1}>
                <Text>{displayOutput}</Text>
              </Box>
            );
        })()}
        {activeTool && uiState !== 'tool-prompt' && uiState !== 'tool-select' && (
          <Box flexDirection="row">
            <Text color="green" bold>● </Text>
            <Text color="yellow" bold>{activeTool} </Text>
            <Text color="gray"><Spinner type="dots" /> processando...</Text>
          </Box>
        )}
        {isThinking && !streamingText && !activeTool && uiState !== 'tool-prompt' && uiState !== 'tool-select' && (
          <Text color="cyan"><Spinner type="dots" /> Pensando...</Text>
        )}
      </Box>

      {/* --- MODAIS (QUADRADOS ACIMA DO CHAT) --- */}
      {uiState === 'tool-select' && toolSelectData && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>{toolSelectData.msg}</Text>
          <SelectInput
            items={toolSelectData.options}
            onSelect={(item) => {
              const res = toolSelectData.resolve;
              setToolSelectData(null);
              setUiState('chat');
              res(item.value as string);
            }}
          />
        </Box>
      )}

      {uiState === 'tool-prompt' && promptData && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>{promptData.msg}</Text>
          <Box>
            <Text color="green" bold>❯ </Text>
            <TextInput value={promptInput} onChange={setPromptInput} onSubmit={(val) => {
              const res = promptData.resolve;
              setPromptData(null);
              setPromptInput('');
              setUiState('chat');
              res(val);
            }} />
          </Box>
        </Box>
      )}

      {uiState === 'commands' && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>Comandos Disponíveis (Esc para cancelar):</Text>
          <SelectInput
            items={[
              { label: '/provider - Trocar provedor de IA', value: 'provider' },
              { label: '/model - Trocar modelo', value: 'model' },
              { label: '/session - Carregar sessão anterior', value: 'session' },
              { label: '/clear - Limpar histórico', value: 'clear' },
              { label: '/exit - Sair do agente', value: 'exit' },
            ]}
            onSelect={handleCommandSelect}
          />
        </Box>
      )}

      {uiState === 'sessions' && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>Selecione uma sessão (Esc para cancelar):</Text>
          <SelectInput
            items={sessionOptions}
            onSelect={async (item) => {
              const msgs = await loadSession(item.value as string);
              setCurrentSession(item.value as string);
              setMessages(msgs);
              setSessionKey(k => k + 1);
              setUiState('chat');
            }}
          />
        </Box>
      )}

      {uiState === 'providers' && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>Selecione o provedor (Esc para cancelar):</Text>
          <SelectInput
            items={PROVIDERS.map(p => {
              const hasKey = config.providers?.[p.name]?.apiKey;
              const marker = hasKey ? pc.green('✔ ') : '  ';
              return { label: `${marker}${p.label}`, value: p.name };
            })}
            onSelect={handleProviderSelect}
          />
        </Box>
      )}

      {uiState === 'apikey' && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>API Key para {selectedProvider} (Enter para salvar): </Text>
          {config.providers?.[selectedProvider]?.apiKey && (
            <Text color="gray">Esse provedor já possui uma chave salva. Digite uma nova para substituir, ou apenas aperte Enter para manter a atual e conectar.</Text>
          )}
          <TextInput value={apiKeyInput} onChange={setApiKeyInput} onSubmit={handleApiKeySubmit} />
        </Box>
      )}

      {uiState === 'model' && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text color="yellow" bold>Nome do Modelo (Enter para salvar, Esc para cancelar): </Text>
          <TextInput value={modelInput} onChange={setModelInput} onSubmit={handleModelSubmit} />
        </Box>
      )}

      {/* --- CAIXA DE CHAT PRINCIPAL (DUAS LINHAS) --- */}
      <Box borderStyle="single" borderLeft={false} borderRight={false} borderColor="gray" paddingX={1} flexDirection="column">
        <Box>
          <Text color="green" bold>❯ </Text>
          {uiState === 'chat' ? (
            <TextInput value={input} onChange={handleChatChange} onSubmit={handleChatSubmit} />
          ) : (
            <Text>{input}</Text>
          )}
        </Box>
      </Box>
    </>
  );
}
