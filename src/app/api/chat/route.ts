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
    const stepRes = runResult.results['processItems'];
    let items: Array<{ title: string; link: string; summary: string }> = [];
    if (stepRes?.status === 'success') {
      items = stepRes.output.results;
    }
    return NextResponse.json({ results: items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 