# Documentação Técnica do OpenMux

Esta documentação detalha a arquitetura interna do **OpenMux** (anteriormente Termux AI Agent).
O projeto foi totalmente reescrito para utilizar **React Ink**, abandonando interfaces sequenciais em favor de uma UI declarativa reativa.

---

## 1. Visão Geral da Arquitetura

O OpenMux é uma CLI Node.js escrita em TypeScript que usa React (via biblioteca `ink`) para renderizar e controlar a tela do terminal.

A arquitetura baseia-se em 3 pilares:
1. **Frontend Terminal (React/Ink):** Arquivos `App.tsx` e `repl.tsx`. Gerenciam entrada do usuário, atalhos globais, renderização condicional de Modais flutuantes e Histórico Estático (`<Static>`).
2. **Núcleo de Inteligência (`agent.ts` e `llm.ts`):** Loop assíncrono que processa o Streaming da API (`vercel/ai` ou `openai` compatível), identificando chamadas de função (Tool Calling) dinamicamente.
3. **Ferramentas (`tools/` e `security.ts`):** Funções encapsuladas do Node.js (filesystem e `child_process`) executadas nativamente no OS, garantindo proteção e permissões baseadas no Diretório de Trabalho (CWD).

---

## 2. Ponto de Entrada: `cli.ts` e `repl.tsx`

O arquivo `src/cli.ts` gerencia o registro do binário na linha de comando (`#!/usr/bin/env node`). Ele inicia o processo e chama o arquivo `repl.tsx`.

No `src/repl.tsx`:
- Dispara `initSession()` para gravar localmente o arquivo de chat.
- Monta a aplicação React `<App />` via `render(..., { exitOnCtrlC: false })`. 
- Ao invés de o Ink terminar forçadamente no `Ctrl+C`, o programa espera o `waitUntilExit()`.
- Após unmount suave da interface React, uma logo ASCII generativa é impressa no stdout puro usando `figlet`, calculando `process.stdout.columns` dinamicamente para aplicar Fontes e Layouts menores (ex: _Small Slant_) caso a tela seja pequena.

---

## 3. Motor Visual (O App React): `App.tsx`

Todas as interações ocorrem num único componente de tela.

### Modais Independentes e Sobrepostos
Em vez de desenhar menus sequenciais bloqueantes (que causam deadlocks com streams), modais como a troca de `/model`, `/provider`, navegação de `/session` ou prompts interativos das Tools (via `askUser`, `selectUser` ou `bash-command`) usam o state `uiState` (enum: `'chat' | 'commands' | 'providers' | 'apikey' | 'model' | 'tool-prompt' | 'sessions' | 'tool-select'`).

Eles são renderizados **acima** da barra de digitação. Ao acionar um Modal, a barra inferior é "congelada" substituindo-se dinamicamente o `<TextInput>` interativo por um simples `<Text>` estático para evitar "roubo" de foco de teclado.

A navegação interativa é feita extensivamente utilizando listas (setas direcionais + enter) via `<SelectInput>` para as opções fixas e confirmações de permissão.

### Feedback Visual e Estado Local
Os modais que interagem com configurações persistidas (como a seleção de provedores e inserção de API Keys) acessam diretamente o objeto de configuração carregado em memória (`config.providers`). Isso permite fornecer feedback visual dinâmico em tempo real, rodando estritamente no frontend local. Por exemplo, a lista de provedores indica visualmente (com `✅` ou `🔹`) quais provedores já possuem uma chave de API configurada no dispositivo. Ao selecionar um provedor já configurado, a interface orienta o usuário de que é possível manter a chave atual apenas confirmando a operação (pressionando Enter).

### O Histórico Estático
Para resolver problemas de scroll nativo no Android/Termux, todo o histórico da conversa usa o `<Static>` do Ink.
- Mensagens do sistema são transformadas em componentes `<Box>`.
- `marked-terminal` é integrado com `marked` para renderizar formatação Markdown complexa.
- Para evitar bugs visuais (flickering) quando a IA responde com textos muito grandes, o bloco dinâmico de streaming corta visualmente o texto garantindo que ele não ultrapasse a altura máxima do viewport do terminal.
- O componente `<Static>` recebe uma `sessionKey` de controle no React. Isso evita a quebra nativa do Ink caso a array diminua de tamanho, forçando uma recriação completa da tela ao usar `/clear` ou mudar de `/session`.
- Exibições no estilo _Claude Code_ foram aplicadas: As intenções de chamadas de Tool aparecem em caixas discretas na cor cinza e pontuações verdes ("● bash-command"). Os retornos dessas ferramentas (`role: tool`) também são plotados de forma truncada e discreta (ex: `└──  retorno...`), mantendo transparência total do que está sendo executado sem poluir a interface.

### O Estado da Conversa (Messages Array)
A lista de mensagens segue estritamente a tipagem `OpenAI.Chat.Completions.ChatCompletionMessageParam`. O estado é passado tanto para o `<Static>` visual quanto para `agent.ts`. Sempre que as mensagens mudam, o hook `useEffect` aciona `saveSession(messages)` do módulo `session.ts`.

---

## 4. O Cérebro: `agent.ts`

O coração da lógica do LLM é o loop `runAgentLoop`.

Ele executa infinitamente até que a IA dê uma resposta de texto puro final sem acionar ferramentas:
1. Concatena os prompts.
2. Faz streaming via Cliente OpenAI universal (que se ajusta via baseURL de `config.ts`).
3. Dispara callbacks dinâmicos para a View (`onStream` de texto livre e `onTool` que fornece feedback dinâmico visual até mesmo enquanto os parâmetros JSON da ferramenta ainda estão sendo "pensados").
4. Acumula os chunks no `ToolCallAccumulator`.
5. Extrai as chamadas, executa o `getToolHandler` de `tools/index.ts` fornecendo uma dependência de injeção `ctx: ToolContext`.
6. Grava os Resultados na array e emite um evento local de `onUpdate(messages)` para o `App.tsx` fazer o "commit" visual sequencial no `<Static>`, repetindo o loop e enviando o Tool Result de volta ao LLM.

### Injeção de Contexto (`ToolContext`)
Para evitar brigas de Stdin/Stdout entre componentes puros e os antigos prompts baseados em `inquirer`, as tools NUNCA pedem prompt direto no terminal. Em vez disso, usam funções isoladas como `ctx.askUser()` (para entrada de texto) e `ctx.selectUser()` (para seleção com setas).
O `agent.ts` recebe os callbacks do componente pai (`App.tsx`), então quando a Tool executa `ctx.selectUser()`, ela muda o React State para `uiState='tool-select'`. O usuário seleciona interativamente na UI, a Promise é resolvida com o valor escolhido, e o código assíncrono da Tool continua perfeitamente isolado.

---

## 5. Módulo de Ferramentas (`tools/`)

Ferramentas seguem estritamente o Schema da API da OpenAI.

**Ferramentas disponíveis:**
- `bash-command`: Roda shell scripts e captura o buffer do terminal (`exec`). Pede confirmação usando `ctx.selectUser`.
- `ask-user`: Faz uma pergunta complexa para resolver dúvidas ambíguas.
- Operações de Arquivo: `create_file`, `read_file`, `edit_file`, `delete_path`, `create_directory`, `list_directory`.

Todas as ferramentas que alteram o sistema de arquivos dependem do `security.ts`. A regra rígida é: o agente só tem permissão livre no `process.cwd()` de onde a CLI foi iniciada. Operações fora deste _working directory_ acionam um prompt interativo confirmando a elevação de segurança.

---

## 6. Módulo de Sessões (`session.ts`)

Gravado na nova pasta `~/.openmux/sessions/`.
- Usando a estratégia de **Lazy Load**, o arquivo só é criado (`initSession()`) no momento em que o usuário envia a primeira mensagem (evitando poluição com sessões vazias).
- O nome do arquivo é gerado dinamicamente mesclando a data e um "slug" do assunto (primeira mensagem), ex: `session_2026-09-29_14-30-00_criar-script-python.json`.
- A cada iteração no chat, o histórico `messages` sofre flush para o disco via `writeFileSync`, garantindo a preservação total do contexto.
- O comando `/session` permite recuperar o histórico através da leitura rápida de `getRecentSessions()`.
