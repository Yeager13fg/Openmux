import pc from 'picocolors';

import { getClient } from './llm.js';
import { buildSystemPrompt } from './system-prompt.js';
import { getToolDefinitions, getToolHandler } from './tools/index.js';

import type { AppConfig, Message, ToolCallAccumulator, ToolContext } from './types.js';

// ============================================================
//  Núcleo do Agente - Loop de Raciocínio com Tool Calling
//  Envia mensagens ao LLM, processa streaming e executa tools
// ============================================================

export async function runAgentLoop(
  messages: Message[],
  config: AppConfig,
  onStream: (chunk: string) => void,
  onTool: (toolName: string) => void,
  onPrompt: (msg: string) => Promise<string>,
  onToolSelect: (msg: string, options: {label: string, value: string}[]) => Promise<string>,
  onUpdate: (newMessages: Message[]) => void,
  onFinish: (newMessages: Message[]) => void
): Promise<void> {
  const client = getClient();
  const toolDefs = getToolDefinitions();

  while (true) {
    try {
      const stream = await client.chat.completions.create({
        model: config.activeModel,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages,
        ],
        tools: toolDefs,
        stream: true,
      });

      let fullContent = '';
      const toolCalls: ToolCallAccumulator[] = [];

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        const delta = choice.delta;

        if (delta?.content) {
          fullContent += delta.content;
          onStream(delta.content);
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCalls[tc.index]) {
              toolCalls[tc.index] = { id: '', name: '', arguments: '' };
            }
            if (tc.id) toolCalls[tc.index].id = tc.id;
            if (tc.function?.name) {
              toolCalls[tc.index].name = tc.function.name;
              onTool(`${tc.function.name} [gerando parâmetros...]`);
            }
            if (tc.function?.arguments) {
              toolCalls[tc.index].arguments += tc.function.arguments;
            }
          }
        }
      }

      if (toolCalls.length === 0) {
        if (fullContent) {
          messages.push({ role: 'assistant', content: fullContent });
        }
        onFinish(messages);
        break;
      }

      messages.push({
        role: 'assistant',
        content: fullContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        })),
      });

      onUpdate(messages);

      for (const tc of toolCalls) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(tc.arguments);
        } catch {
          args = {};
        }

        onTool(tc.name);
        const handler = getToolHandler(tc.name);
        let result: string;
        const ctx: ToolContext = { askUser: onPrompt, selectUser: onToolSelect };

        if (handler) {
          try {
            result = await handler(args, ctx);
          } catch (error: unknown) {
            result = `Erro interno ao executar a ferramenta: ${(error as Error).message}`;
          }
        } else {
          result = `Erro: Ferramenta "${tc.name}" não encontrada.`;
        }

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
        
        onUpdate(messages);
      }
    } catch (error: unknown) {
      throw error;
    }
  }
}
