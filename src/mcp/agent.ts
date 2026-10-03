import 'dotenv/config'
import {
  Client,
  type Tool as McpTool
} from '@modelcontextprotocol/client'
import {
  StdioClientTransport
} from '@modelcontextprotocol/client/stdio'
import OpenAI from 'openai'
import {
  toResponseInputItems
} from 'openai/lib/responses/ResponseInputItems'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const openai = new OpenAI({ apiKey })
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const mcpClient = new Client({
  name: 'parnaioca-agent',
  version: '1.0.0'
})

const transport = new StdioClientTransport({
  command: 'npx',
  args: [
    'tsx',
    'src/mcp/server.ts'
  ]
})

function toOpenAITool(
  tool: McpTool
): OpenAI.Responses.FunctionTool {
  return {
    type: 'function',
    name: tool.name,
    description:
      tool.description ?? 'Ferramenta fornecida pelo servidor MCP',
    parameters: tool.inputSchema,
    strict: false
  }
}

async function runAgent(question: string) {
  await mcpClient.connect(transport)

  const { tools: mcpTools } =
    await mcpClient.listTools()

  const tools = mcpTools.map(toOpenAITool)

  const input: OpenAI.Responses.ResponseInput = [
    {
      role: 'user',
      content: question
    }
  ]

  for (let round = 1; round <= 5; round++) {
    console.log(`RODADA ${round}`)

    const response = await openai.responses.create({
      model,
      instructions: `
        Você é o assistente da Pousada Parnaioca.
        Use as ferramentas disponíveis quando precisar
        consultar dados da pousada.
        Não invente informações.
      `,
      input,
      tools
    })

    input.push(
      ...toResponseInputItems(response.output)
    )

    const toolCalls = response.output.filter(
      (item) => item.type === 'function_call'
    )

    if (toolCalls.length === 0) {
      return response.output_text
    }

    for (const toolCall of toolCalls) {
      console.log('MCP TOOL CALL', {
        name: toolCall.name,
        arguments: toolCall.arguments
      })

      const result = await mcpClient.callTool({
        name: toolCall.name,
        arguments: JSON.parse(
          toolCall.arguments
        ) as Record<string, unknown>
      })

      console.log('MCP TOOL RESULT', result)

      input.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(result)
      })
    }
  }

  throw new Error(
    'O agente não terminou após 5 rodadas'
  )
}

try {
  const answer = await runAgent(
    'O João está cadastrado? Qual é o e-mail dele?'
  )

  console.log('\nRESPOSTA FINAL')
  console.log(answer)
} finally {
  await mcpClient.close()
}
