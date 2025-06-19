
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY, // Use environment variable
    }),
  ],
  model: 'googleai/gemini-2.5-flash'//efault model
});