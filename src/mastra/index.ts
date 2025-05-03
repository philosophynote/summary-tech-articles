import { Mastra } from '@mastra/core';
import { newsWorkflow } from './workflows/newsWorkflow';
import { perplexityAgent } from './agents/perplexityAgent';

export const mastra: Mastra = new Mastra({
  workflows: {
    'news-workflow': newsWorkflow,
  },
  agents: {
    perplexityAgent,
  },
});
        