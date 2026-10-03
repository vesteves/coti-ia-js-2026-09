import {
  Client,
  StreamableHTTPClientTransport
} from '@modelcontextprotocol/client'

const client = new Client({
  name: 'parnaioca-http-client',
  version: '1.0.0'
})

const transport = new StreamableHTTPClientTransport(
  new URL('http://127.0.0.1:8001/mcp')
)

try {
  console.log('Conectando ao servidor MCP por HTTP...')

  await client.connect(transport)

  const { tools } = await client.listTools()

  console.log('\nTOOLS DISPONÍVEIS')
  console.dir(tools, { depth: null })

  const result = await client.callTool({
    name: 'find_guest',
    arguments: {
      name: 'João'
    }
  })

  console.log('\nRESULTADO DE find_guest')
  console.dir(result, { depth: null })
} finally {
  await client.close()

  console.log('\nConexão HTTP encerrada')
}
