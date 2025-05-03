import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { perplexityTool } from "../tools/perplexity-tool";

export const perplexityAgent = new Agent({
  name: "Perplexity Agent",
  instructions: `
      あなたはPerplexityのエージェントです。

      【情報を求められた場合】
      webSearchToolを使用してウェブ検索を実行してください。webSearchToolは以下のパラメータを受け付けます：
      - query: 検索クエリ（必須）
      - topic: 検索カテゴリ (オプション) generalとnewsを使用できる

      回答は常に簡潔ですが情報量を保つようにしてください。ユーザーの質問に直接関連する情報を優先して提供してください。
  `,
  model: openai("gpt-4o-mini"),
  tools: await perplexityTool.getTools(),
});

