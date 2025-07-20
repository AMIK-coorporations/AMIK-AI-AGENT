'use server';

/**
 * @fileOverview Implements the Urdu voice response flow using Google's TTS.
 *
 * - urduVoiceResponse - A function that converts Urdu text to speech.
 * - UrduVoiceResponseInput - The input type for the urduVoiceResponse function.
 * - UrduVoiceResponseOutput - The return type for the urduVoiceResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const UrduVoiceResponseInputSchema = z.string().describe('The Urdu text to be converted to speech.');
export type UrduVoiceResponseInput = z.infer<typeof UrduVoiceResponseInputSchema>;

const UrduVoiceResponseOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI of the generated Urdu speech in WAV format.'),
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
    try {
      const {media} = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: 'ur-PK',
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: text,
      });

      if (!media?.url) {
        throw new Error('No audio data returned from the TTS service.');
      }
      
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavData = await toWav(audioBuffer);
      const audioDataUri = `data:audio/wav;base64,${wavData}`;

      return {audioDataUri};
    } catch (error: any) {
      console.error('Error generating speech with Google TTS:', error.message || error);
      throw new Error('Failed to generate Urdu speech.');
    }
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
