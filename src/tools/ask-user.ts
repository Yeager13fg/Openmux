import type { Tool } from '../types.js';

export const askUserTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'ask_user',
      description: 'Faz uma pergunta ao usuário. Use quando precisar de informações, esclarecer ambiguidades, ou perguntar o que fazer a seguir.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'A pergunta a ser feita ao usuário',
          },
        },
        required: ['question'],
      },
    },
  },

  handler: async (args, ctx) => {
    const question = args.question as string;
    try {
      const answer = await ctx.askUser(question);
      return `Resposta do usuário: ${answer}`;
    } catch (error: unknown) {
      const msg = (error as Error).message;
      return `Erro ao perguntar ao usuário: ${msg}`;
    }
  },
};
