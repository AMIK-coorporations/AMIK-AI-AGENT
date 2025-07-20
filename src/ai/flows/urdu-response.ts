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

const urduResponseFlow = ai.defineFlow(
  {
    name: 'urduResponseFlow',
    inputSchema: UrduResponseInputSchema,
    outputSchema: UrduResponseOutputSchema,
  },
  async (input) => {
    const {
      text
    } = await ai.generate({
      model: 'deepseek/deepseek-chat',
      prompt: `You are an AI assistant that responds to users in Urdu. Respond to the user's query in Urdu.\n\nUser Query: ${input.query}`,
    });
    return {
      response: text,
    };
  }
);
