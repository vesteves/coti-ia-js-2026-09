import { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'
import { bedrooms, guests } from '../data/index.js'

export function createParnaiocaMcpServer() {
  const server = new McpServer({
    name: 'parnaioca-mcp',
    version: '1.0.0'
  })

  server.registerTool(
    'find_guest',
    {
      title: 'Buscar hóspede',
      description: 'Busca um hóspede cadastrado pelo nome.',
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .describe('Nome ou parte do nome do hóspede')
      })
    },
    async ({ name }) => {
      const guest = guests.find((item) =>
        item.name
          .toLowerCase()
          .includes(name.toLowerCase())
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(guest ?? null)
          }
        ]
      }
    }
  )

  server.registerResource(
    'bedrooms-catalog',
    'parnaioca://bedrooms/catalog',
    {
      title: 'Catálogo de quartos',
      description: 'Lista os quartos disponíveis na pousada.',
      mimeType: 'application/json'
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(bedrooms, null, 2)
        }
      ]
    })
  )

  return server
}
