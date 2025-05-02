import { Mastra } from '@mastra/core';
import { newsWorkflow } from './workflows/newsWorkflow';

export const mastra: Mastra = new Mastra({
  workflows: { newsWorkflow },
});
        