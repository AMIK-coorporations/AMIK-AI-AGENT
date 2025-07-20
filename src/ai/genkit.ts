import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    googleAI({
      id: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiHost: 'api.deepseek.com',
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
