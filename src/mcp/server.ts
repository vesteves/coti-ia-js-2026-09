import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { createParnaiocaMcpServer } from './create-server.js'

serveStdio(createParnaiocaMcpServer)

console.error('Servidor MCP da Parnaioca iniciado')
