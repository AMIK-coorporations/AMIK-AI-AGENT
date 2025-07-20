'use server';

/**
 * @fileOverview Implements the Urdu voice response flow using ElevenLabs API.
 *
 * - urduVoiceResponse - A function that converts Urdu text to speech.
 * - UrduVoiceResponseInput - The input type for the urduVoiceResponse function.
 * - UrduVoiceResponseOutput - The return type for the urduVoiceResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import ElevenLabs from 'elevenlabs-node';

const UrduVoiceResponseInputSchema = z.string().describe('The Urdu text to be converted to speech.');
export type UrduVoiceResponseInput = z.infer<typeof UrduVoiceResponseInputSchema>;

const UrduVoiceResponseOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI of the generated Urdu speech.'),
});
export type UrduVoiceResponseOutput = z.infer<typeof UrduVoiceResponseOutputSchema>;

export async function urduVoiceResponse(input: UrduVoiceResponseInput): Promise<UrduVoiceResponseOutput> {
  return urduVoiceResponseFlow(input);
}

const urduVoiceResponseFlow = ai.defineFlow(
  {
    name: 'urduVoiceResponseFlow',
    inputSchema: UrduVoiceResponseInputSchema,
    outputSchema: UrduVoiceResponseOutputSchema,
  },
  async input => {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key is missing. Set the ELEVENLABS_API_KEY environment variable.');
    }

    const voiceId = '21m00Tcm4TlvDq8iK5zH'; // Default voice ID, feel free to change.
    const modelId = 'eleven_multilingual_v2';

    const elevenLabsClient = new ElevenLabs({apiKey: elevenLabsApiKey});

    try {
      const audioBuffer = await elevenLabsClient.textToSpeech({
        text: input,
        voiceId: voiceId,
        modelId: modelId,
      });

      const audioBase64 = audioBuffer.toString('base64');
      const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;

      return {audioDataUri: audioDataUri};
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate Urdu speech.');
    }
  }
);
