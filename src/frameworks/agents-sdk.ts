import 'dotenv/config'
import {
  Agent,
  MCPServerStdio,
  run
} from '@openai/agents'

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const mcpServer = new MCPServerStdio({
  name: 'Parnaioca MCP',
  command: 'npx',
  args: [
    'tsx',
    'src/mcp/server.ts'
  ],
  cacheToolsList: true
})

try {
  await mcpServer.connect()

  const agent = new Agent({
    name: 'Assistente Parnaioca',
    instructions: `
      Você é o assistente da Pousada Parnaioca.

      Use as ferramentas disponíveis quando precisar
      consultar os dados da pousada.

      Não invente informações.
    `,
    model,
    mcpServers: [
      mcpServer
    ]
  })

  const result = await run(
    agent,
    'O João está cadastrado? Qual é o e-mail dele?'
  )

  console.log('RESPOSTA FINAL')
  console.log(result.finalOutput)
} finally {
  await mcpServer.close()
}
