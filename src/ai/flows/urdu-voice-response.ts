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
  async (text) => {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key is missing. Set the ELEVENLABS_API_KEY environment variable.');
    }

    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - a popular voice that supports multilingual v2
    const modelId = 'eleven_multilingual_v2';

    const elevenLabsClient = new ElevenLabs({apiKey: elevenLabsApiKey});

    try {
      const response = await elevenLabsClient.textToSpeech({
        text,
        voiceId,
        modelId,
        outputFormat: 'mp3_44100_128'
      });
      
      const audioBase64 = response.toString('base64');
      const audioDataUri = `data:audio/mpeg;base64,${audioBase64}`;

      return {audioDataUri};
    } catch (error: any) {
      console.error('Error generating speech with ElevenLabs:', error.message || error);
      throw new Error('Failed to generate Urdu speech.');
    }
  }
);
