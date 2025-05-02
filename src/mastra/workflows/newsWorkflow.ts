import { Workflow, Step } from '@mastra/core/workflows';
import Parser from 'rss-parser';
import axios from 'axios';
import { load } from 'cheerio';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// 記事アイテムのスキーマ
const itemSchema = z.object({
  title: z.string(),
  link: z.string().url(),
});

// RSSを取得してクエリに関連する上位3件を抽出するステップ
const fetchRssStep = new Step({
  id: 'fetchRss',
  outputSchema: z.object({ items: z.array(itemSchema) }),
  execute: async ({ context }) => {
    const parser = new Parser();
    const feed = await parser.parseURL('https://ai-news.dev/feeds/');
    const items = (feed.items || [])
      .map(item => ({ title: item.title || '', link: item.link || '' }))
      .filter(i => i.title && i.link);

    // OpenAI埋め込みモデル
    const embeddingModel = openai.embedding('text-embedding-3-small');

    // タイトルの埋め込みを一括生成
    const titleTexts = items.map(i => i.title);
    const titleEmbeddingRes = await embeddingModel.doEmbed({ values: titleTexts });
    const titleEmbeddings = titleEmbeddingRes.embeddings;

    // クエリの埋め込み
    const queryEmbeddingRes = await embeddingModel.doEmbed({ values: [context.triggerData.query] });
    const queryEmbedding = queryEmbeddingRes.embeddings[0];

    // コサイン類似度計算関数
    function cosineSimilarity(a: number[], b: number[]): number {
      const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
      const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
      return dot / (normA * normB);
    }

    // 類似度でソート
    const itemsWithScore = items.map((item, idx) => ({
      ...item,
      score: cosineSimilarity(titleEmbeddings[idx], queryEmbedding),
    }));
    itemsWithScore.sort((a, b) => b.score - a.score);
    const topItems = itemsWithScore.slice(0, 3).map(({ score, ...rest }) => rest);
    return { items: topItems };
  },
});

// ページから本文を抽出するステップ
const fetchPageStep = new Step({
  id: 'fetchPage',
  inputSchema: z.object({ item: itemSchema }),
  outputSchema: z.object({
    content: z.string(),
    title: z.string(),
    link: z.string().url(),
  }),
  execute: async ({ context }) => {
    const { item } = context.inputData;
    const { data } = await axios.get(item.link);
    const $ = load(data);
    const content = $('p')
      .map((_, el) => $(el).text())
      .get()
      .join('\n');
    return { content, title: item.title, link: item.link };
  },
});

// 要約用のAgentとステップ
const summarizationAgent = new Agent({
  name: 'summarizer',
  instructions: '与えられたテキストを日本語で3文程度に要約してください。',
  model: openai('gpt-4o-mini'),
});
const summarizationStep = summarizationAgent.toStep();

// 動的ワークフローで各記事を処理するステップ
const processItemsStep = new Step({
  id: 'processItems',
  inputSchema: z.object({ items: z.array(itemSchema) }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        link: z.string().url(),
        summary: z.string(),
      })
    ),
  }),
  execute: async ({ context, mastra: mastraInstance }) => {
    const items = context.inputData.items;
    // 動的ワークフローを作成
    const dynamicWorkflow = new Workflow({
      name: 'process-items',
      mastra: mastraInstance as any,
      triggerSchema: z.object({ item: itemSchema }),
    });
    dynamicWorkflow
      .step(fetchPageStep, {
        variables: {
          item: { step: 'trigger', path: 'item' },
        },
      })
      .then(summarizationStep, {
        variables: {
          prompt: { step: fetchPageStep, path: 'content' },
        },
      })
      .commit();

    const results: Array<{ title: string; link: string; summary: string }> = [];
    // 各記事ごとにワークフローを実行
    for (const item of items) {
      const run = dynamicWorkflow.createRun();
      const res = await run.start({ triggerData: { item } });
      const stepResult = res.results['summarizer'];
      let summaryText = '';
      if (stepResult?.status === 'success') {
        summaryText = stepResult.output.text;
      }
      results.push({ title: item.title, link: item.link, summary: summaryText });
    }

    return { results };
  },
});

// メインのニュースワークフロー
export const newsWorkflow = new Workflow({
  name: 'news-workflow',
  triggerSchema: z.object({ query: z.string() }),
});
newsWorkflow
  .step(fetchRssStep)
  .then(processItemsStep, {
    variables: {
      items: { step: fetchRssStep, path: 'items' },
    }
  })
  .commit(); 