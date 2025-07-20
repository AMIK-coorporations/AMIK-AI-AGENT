'use server';

/**
 * @fileOverview A simple AI flow to generate an Urdu response.
 *
 * - urduResponse - A function that handles generating an Urdu response.
 * - UrduResponseInput - The input type for the urduResponse function.
 * - UrduResponseOutput - The return type for the urduResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrduResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
});
export type UrduResponseInput = z.infer<typeof UrduResponseInputSchema>;

const UrduResponseOutputSchema = z.object({
  response: z.string().describe('The AI-generated response in Urdu.'),
});
export type UrduResponseOutput = z.infer<typeof UrduResponseOutputSchema>;

export async function urduResponse(input: UrduResponseInput): Promise<UrduResponseOutput> {
  return urduResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'urduResponsePrompt',
  input: {schema: UrduResponseInputSchema},
  output: {schema: UrduResponseOutputSchema},
  prompt: `You are an AI assistant that responds to users in Urdu. Respond to the user's query in Urdu.\n\nUser Query: {{{query}}}`,
});

const urduResponseFlow = ai.defineFlow(
  {
    name: 'urduResponseFlow',
    inputSchema: UrduResponseInputSchema,
    outputSchema: UrduResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {response: output!.response};
  }
);
