import {
  Client
} from '@modelcontextprotocol/client'
import {
  StdioClientTransport
} from '@modelcontextprotocol/client/stdio'

const client = new Client({
  name: 'parnaioca-client',
  version: '1.0.0'
})

const transport = new StdioClientTransport({
  command: 'npx',
  args: [
    'tsx',
    'src/mcp/server.ts'
  ]
})

try {
  console.log('Conectando ao servidor MCP...')

  await client.connect(transport)

  console.log('\nTOOLS DISPONÍVEIS')

  const { tools } = await client.listTools()

  console.dir(tools, {
    depth: null
  })

  console.log('\nEXECUTANDO find_guest')

  const toolResult = await client.callTool({
    name: 'find_guest',
    arguments: {
      name: 'João'
    }
  })

  console.dir(toolResult, {
    depth: null
  })

  console.log('\nEXECUTANDO TOOL INEXISTENTE')

  try {
    await client.callTool({
      name: 'tool_inexistente',
      arguments: {}
    })
  } catch (error) {
    console.error('Erro esperado:', error)
  }

  console.log('\nRESOURCES DISPONÍVEIS')

  const { resources } =
    await client.listResources()

  console.dir(resources, {
    depth: null
  })

  console.log('\nLENDO CATÁLOGO DE QUARTOS')

  const resourceResult =
    await client.readResource({
      uri: 'parnaioca://bedrooms/catalog'
    })

  console.dir(resourceResult, {
    depth: null
  })
} finally {
  await client.close()

  console.log('\nConexão encerrada')
}
