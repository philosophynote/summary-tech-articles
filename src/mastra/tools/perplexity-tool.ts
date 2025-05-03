import { MCPClient } from '@mastra/mcp'

export const perplexityTool = new MCPClient({
  id: 'perplexity-tool',
  servers: {
    perplexityAsk: {
      command: 'npx',
      args: [
        "-y",
        "server-perplexity-ask"
      ],
      env: {
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
      },
    },
  },
  timeout: 30000
})