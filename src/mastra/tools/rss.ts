import { createTool } from '@mastra/core/tools';
import Parser from 'rss-parser';
import { z } from 'zod';

export const fetchRssTool = createTool({
  id: 'fetchRssTool',
  description: 'RSSフィードを取得し、エントリのタイトルとリンクを返します',
  inputSchema: z.object({ feedUrl: z.string().url() }),
  outputSchema: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        link: z.string().url(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const parser = new Parser();
    const feed = await parser.parseURL(context.feedUrl);
    const items = (feed.items || [])
      .map(item => ({
        title: item.title || '',
        link: item.link || '',
      }))
      .filter(item => item.link);
    return { items };
  },
}); 