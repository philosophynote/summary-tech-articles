import { NextResponse } from 'next/server'
 
export async function POST(req: Request) {
  // Dynamic import to avoid TDZ and circular dependency
  const { mastra } = await import('@/mastra');
  const { query } = await req.json();
  const workflow = mastra.getWorkflow('news-workflow');
  const { start } = workflow.createRun();
  const result = await start({ triggerData: { query } });
  return NextResponse.json(result);
}