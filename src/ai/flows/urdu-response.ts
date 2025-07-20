'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating Urdu responses based on user input.
 * It leverages the DeepSeek API tool for generating contextually appropriate Urdu responses.
 *
 * - urduResponse - A function that handles the Urdu response generation process.
 * - UrduResponseInput - The input type for the urduResponse function.
 * - UrduResponseOutput - The return type for the urduResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrduResponseInputSchema = z.object({
  query: z.string().describe('The user query in Urdu.'),
});
export type UrduResponseInput = z.infer<typeof UrduResponseInputSchema>;

const UrduResponseOutputSchema = z.object({
  response: z.string().describe('The AI response in Urdu.'),
});
export type UrduResponseOutput = z.infer<typeof UrduResponseOutputSchema>;

export async function urduResponse(input: UrduResponseInput): Promise<UrduResponseOutput> {
  return urduResponseFlow(input);
}

const deepSeekUrduTool = ai.defineTool({
  name: 'deepSeekUrduTool',
  description: 'Generates contextually appropriate Urdu responses based on user input.',
  inputSchema: z.object({
    query: z.string().describe('The user query in Urdu.'),
  }),
  outputSchema: z.string(),
},
async (input) => {
  const {
    text
  } = await ai.generate({
    model: 'models/deepseek-chat',
    prompt: input.query,
  });
  return text;
}
);

const urduResponsePrompt = ai.definePrompt({
  name: 'urduResponsePrompt',
  tools: [deepSeekUrduTool],
  input: {schema: UrduResponseInputSchema},
  output: {schema: UrduResponseOutputSchema},
  prompt: `You are an AI assistant that responds to users in Urdu. Use the deepSeekUrduTool to generate the response to the user's query in Urdu.\n\nUser Query: {{{query}}}`,
});

const urduResponseFlow = ai.defineFlow(
  {
    name: 'urduResponseFlow',
    inputSchema: UrduResponseInputSchema,
    outputSchema: UrduResponseOutputSchema,
  },
  async input => {
    const {output} = await urduResponsePrompt(input);
    return {
      response: output!,
    };
  }
);
