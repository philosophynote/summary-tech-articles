import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { mastra } = await import('@/mastra');
    const { query } = await req.json();
    const workflow = mastra.getWorkflow('news-workflow');
    const { start } = workflow.createRun();
    // ワークフロー実行
    const runResult = await start({ triggerData: { query } });
    // processItemsステップの結果を抽出
    const processItemsRes = runResult.results['processItems'];
    const perplexityRes = runResult.results['Perplexity Agent'];
    let items: Array<{ title: string; link: string; summary: string }> = [];
    let perplexityResult = '';
    if (processItemsRes?.status === 'success') {
      items = processItemsRes.output.results;
    }
    if (perplexityRes?.status === 'success') {
      perplexityResult = perplexityRes.output.text;
    }
    return NextResponse.json({ results: items, perplexity: perplexityResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 