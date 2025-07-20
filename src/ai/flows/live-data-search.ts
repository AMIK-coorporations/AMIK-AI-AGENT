'use server';

/**
 * @fileOverview An AI agent that uses the Brave Search API to provide current information.
 *
 * - liveDataSearch - A function that handles the search process.
 * - LiveDataSearchInput - The input type for the liveDataSearch function.
 * - LiveDataSearchOutput - The return type for the liveDataSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LiveDataSearchInputSchema = z.object({
  query: z.string().describe('The search query to use with the Brave Search API.'),
});
export type LiveDataSearchInput = z.infer<typeof LiveDataSearchInputSchema>;

const LiveDataSearchOutputSchema = z.object({
  results: z.string().describe('The search results from the Brave Search API.'),
});
export type LiveDataSearchOutput = z.infer<typeof LiveDataSearchOutputSchema>;

export async function liveDataSearch(input: LiveDataSearchInput): Promise<LiveDataSearchOutput> {
  return liveDataSearchFlow(input);
}

const braveSearch = ai.defineTool({
  name: 'braveSearch',
  description: 'This tool uses the Brave Search API to get current information from the web.',
  inputSchema: z.object({
    query: z.string().describe('The search query.'),
  }),
  outputSchema: z.string().describe('The search results.'),
}, async (input) => {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error('BRAVE_SEARCH_API_KEY is not set.');
  }
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(input.query)}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return JSON.stringify(data);
});

const prompt = ai.definePrompt({
  name: 'liveDataSearchPrompt',
  tools: [braveSearch],
  input: {schema: LiveDataSearchInputSchema},
  output: {schema: LiveDataSearchOutputSchema},
  prompt: `You are an AI assistant that uses the Brave Search API to provide current information.

  The user will provide a search query, and you should use the braveSearch tool to find relevant information.
  Return the search results to the user.
  
  User query: {{{query}}}
  `,
});

const liveDataSearchFlow = ai.defineFlow(
  {
    name: 'liveDataSearchFlow',
    inputSchema: LiveDataSearchInputSchema,
    outputSchema: LiveDataSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
