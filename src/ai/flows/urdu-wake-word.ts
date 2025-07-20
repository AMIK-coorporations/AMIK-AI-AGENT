'use server';

/**
 * @fileOverview Recognizes the Urdu wake word 'مصنوئی ذھانت'.
 *
 * - recognizeUrduWakeWord - A function that checks if the input contains the wake word.
 * - RecognizeUrduWakeWordInput - The input type for the recognizeUrduWakeWord function.
 * - RecognizeUrduWakeWordOutput - The return type for the recognizeUrduWakeWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeUrduWakeWordInputSchema = z.object({
  text: z.string().describe('The input text to check for the wake word.'),
});
export type RecognizeUrduWakeWordInput = z.infer<typeof RecognizeUrduWakeWordInputSchema>;

const RecognizeUrduWakeWordOutputSchema = z.object({
  wakeWordDetected: z
    .boolean()
    .describe('Whether the wake word was detected in the input.'),
});
export type RecognizeUrduWakeWordOutput = z.infer<typeof RecognizeUrduWakeWordOutputSchema>;

export async function recognizeUrduWakeWord(
  input: RecognizeUrduWakeWordInput
): Promise<RecognizeUrduWakeWordOutput> {
  return recognizeUrduWakeWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeUrduWakeWordPrompt',
  input: {schema: RecognizeUrduWakeWordInputSchema},
  output: {schema: RecognizeUrduWakeWordOutputSchema},
  prompt: `You are a wake word detector. Your job is to determine if the user has said the wake word, which is 'مصنوئی ذھانت'.

  Input: {{{text}}}

  Respond with whether the wake word was detected or not.
  Return a json formatted response.
  {
    "wakeWordDetected": true or false
  }`,
});

const recognizeUrduWakeWordFlow = ai.defineFlow(
  {
    name: 'recognizeUrduWakeWordFlow',
    inputSchema: RecognizeUrduWakeWordInputSchema,
    outputSchema: RecognizeUrduWakeWordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
