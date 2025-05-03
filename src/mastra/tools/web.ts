import { MCPClient } from '@mastra/mcp'

export const webMcp = new MCPClient({
  id: 'web-mcp',
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
    playwright: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    },
  },
  timeout: 30000
})