import { createTool } from '@mastra/core/tools';
import axios from 'axios';
import { load } from 'cheerio';
import { z } from 'zod';

export const fetchPageTool = createTool({
  id: 'fetchPageTool',
  description: '指定したURLのページから本文を抽出します',
  inputSchema: z.object({ url: z.string().url() }),
  outputSchema: z.object({ content: z.string() }),
  execute: async ({ context }) => {
    const { data } = await axios.get(context.url);
    const $ = load(data);
    const content = $('p')
      .map((_: any, el: any) => $(el).text())
      .get()
      .join('\n');
    return { content };
  },
}); 