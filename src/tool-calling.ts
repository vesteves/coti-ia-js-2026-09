import OpenAI from "openai";
import 'dotenv/config'
import { bedrooms, guests, reservations } from './data/index.js'
import {
  toResponseInputItems
} from 'openai/lib/responses/ResponseInputItems'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

const MAX_ROUNDS = 5
const MAX_TOOL_CALLS = 10

function findGuest(name: string) {
  console.log('----- FUNÇÃO findGuests EXECUTADA -----')

  return guests.find(guest => guest.name.toLowerCase().includes(name.toLowerCase()))
}

function findReservationsByGuestId(guestId: string) {
  console.log('FUNÇÃO findReservationsByGuestId EXECUTADA')

  return reservations.filter(
    reservation => reservation.guestId === guestId
  )
}

function getBedroomById(bedroomId: string) {
  console.log('FUNÇÃO getBedroomById EXECUTADA')

  return bedrooms.find(
    bedroom => bedroom.id === bedroomId
  )
}

type ToolHandler = (
  argumentsData: Record<string, unknown>
) => unknown

const toolHandlers: Record<string, ToolHandler> = {
  findGuest: argumentsData => {
    if (typeof argumentsData.name !== 'string') {
      throw new Error('O argumento name é obrigatório')
    }

    return findGuest(argumentsData.name)
  },

  findReservationsByGuestId: argumentsData => {
    if (typeof argumentsData.guestId !== 'string') {
      throw new Error('O argumento guestId é obrigatório')
    }

    return findReservationsByGuestId(argumentsData.guestId)
  },

  getBedroomById: argumentsData => {
    if (typeof argumentsData.bedroomId !== 'string') {
      throw new Error('O argumento bedroomId é obrigatório')
    }

    return getBedroomById(argumentsData.bedroomId)
  }
}

function executeTool(name: string, argumentsJson: string) {
  try {
    const handler = toolHandlers[name]

    if (!handler) {
      return {
        error: `Ferramenta não encontrada: ${name}`
      }
    }

    const argumentsData = JSON.parse(argumentsJson) as Record<
      string,
      unknown
    >

    return handler(argumentsData)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao executar a ferramenta'
    }
  }
}

const tools: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'findGuest',
    description: 'Busca um hóspede cadastrado pelo nome',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome ou parte do nome do hóspede'
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'findReservationsByGuestId',
    description: 'Busca todas as reservas pertencentes a um hóspede pelo ID',
    parameters: {
      type: 'object',
      properties: {
        guestId: {
          type: 'string',
          description: 'ID do hóspede cadastrado'
        }
      },
      required: ['guestId'],
      additionalProperties: false
    },
    strict: true
  },

  {
    type: 'function',
    name: 'getBedroomById',
    description: `
      Consulta os dados completos de um quarto pelo ID.
      Use quando precisar apresentar nome, descrição,
      capacidade, preço ou comodidades do quarto.
    `,
    parameters: {
      type: 'object',
      properties: {
        bedroomId: {
          type: 'string',
          description: 'ID do quarto, como bedroom-008'
        }
      },
      required: ['bedroomId'],
      additionalProperties: false
    },
    strict: true
  }
]

const conversations = new Map<
  string,
  OpenAI.Responses.ResponseInput
>()

export async function runAgent(
  message: string,
  conversationId: string
) {
  const previousInput =
    conversations.get(conversationId) ?? []

  const input: OpenAI.Responses.ResponseInput = [
    ...previousInput,
    {
      role: 'user',
      content: message
    }
  ]

  let round = 0
  let toolCalls = 0

  while (round < MAX_ROUNDS) {
    round++

    console.log(`RODADA ${round}`)

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions: `
        Você é o assistente da Pousada Parnaioca.

        Use as ferramentas disponíveis quando precisar consultar
        dados da pousada.

        Não invente informações sobre hóspedes ou reservas.
      `,
      input,
      tools
    })

    input.push(
      ...toResponseInputItems(response.output)
    )

    let hasFunctionCall = false

    for (const item of response.output) {
      if (item.type !== 'function_call') {
        continue
      }

      hasFunctionCall = true
      toolCalls++

      if (toolCalls > MAX_TOOL_CALLS) {
        throw new Error(
          `Limite de ${MAX_TOOL_CALLS} chamadas de ferramentas excedido`
        )
      }

      console.log('TOOL CALL', {
        name: item.name,
        arguments: JSON.parse(item.arguments)
      })

      const toolResult = executeTool(
        item.name,
        item.arguments
      )

      console.log('TOOL RESULT', toolResult)

      input.push({
        type: 'function_call_output',
        call_id: item.call_id,
        output: JSON.stringify(toolResult)
      })
    }

    if (!hasFunctionCall) {
      conversations.set(conversationId, input)

      return response.output_text
    }
  }

  throw new Error(
    `O agente não terminou após ${MAX_ROUNDS} rodadas`
  )
}

// const answer = await runAgent('Considerando a data de 6 de setembro de 2026, qual é a próxima reserva de João?')
// console.log(answer)

// response.output_text = response.output[1].content[0].text