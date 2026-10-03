import { createMcpExpressApp } from '@modelcontextprotocol/express'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { createParnaiocaMcpServer } from './create-server.js'

const port = 8001
const app = createMcpExpressApp()

const mcpHandler = createMcpHandler(
  createParnaiocaMcpServer
)

const nodeHandler = toNodeHandler(mcpHandler)

app.all('/mcp', async (request, response) => {
  await nodeHandler(
    request,
    response,
    request.body
  )
})

app.listen(port, '127.0.0.1', () => {
  console.log(
    `Servidor MCP HTTP iniciado em http://127.0.0.1:${port}/mcp`
  )
})
