import 'dotenv/config'
import OpenAI from 'openai'
import {
  toResponseInputItems
} from 'openai/lib/responses/ResponseInputItems'
import { bedrooms, guests, reservations } from './data/index.js'
import {
  AuthContext,
  UserRole
} from './auth.middleware.js'
import {
  requestReservationCancellation
} from './approval.store.js'

function getRequiredEnvironmentVariable(
  name: string
): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `${name} não foi configurada`
    )
  }

  return value
}

const apiKey = getRequiredEnvironmentVariable('OPENAI_API_KEY')

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({
  apiKey
})

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const publicVectorStoreId =
  getRequiredEnvironmentVariable('OPENAI_PUBLIC_VECTOR_STORE_ID')

const internalVectorStoreId =
  getRequiredEnvironmentVariable('OPENAI_INTERNAL_VECTOR_STORE_ID')

if (!publicVectorStoreId) {
  throw new Error(
    'OPENAI_PUBLIC_VECTOR_STORE_ID não foi configurado'
  )
}

if (!internalVectorStoreId) {
  throw new Error(
    'OPENAI_INTERNAL_VECTOR_STORE_ID não foi configurado'
  )
}

function findGuest(name: string) {
  console.log('FUNÇÃO findGuest EXECUTADA')

  return guests.find(guest =>
    guest.name.toLowerCase().includes(name.toLowerCase())
  )
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

type ToolName =
  | 'findGuest'
  | 'findReservationsByGuestId'
  | 'getBedroomById'
  | 'requestReservationCancellation'

const toolPermissions: Record<UserRole, ToolName[]> = {
  guest: [
    'getBedroomById'
  ],

  employee: [
    'findGuest',
    'findReservationsByGuestId',
    'getBedroomById',
    'requestReservationCancellation'
  ],

  manager: [
    'findGuest',
    'findReservationsByGuestId',
    'getBedroomById',
    'requestReservationCancellation'
  ]
}

function isToolAllowed(
  role: UserRole,
  toolName: string
): toolName is ToolName {
  return toolPermissions[role].includes(
    toolName as ToolName
  )
}

type ToolHandler = (
  argumentsData: Record<string, unknown>,
  auth: AuthContext
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
  },

  requestReservationCancellation: (
    argumentsData,
    auth
  ) => {
    if (
      typeof argumentsData.reservationId !== 'string'
    ) {
      throw new Error(
        'O argumento reservationId é obrigatório'
      )
    }

    const approval = requestReservationCancellation(
      argumentsData.reservationId,
      auth.userId
    )

    return {
      message:
        'Cancelamento aguardando aprovação humana',
      approval
    }
  }
}

function executeTool(
  name: string,
  argumentsJson: string,
  auth: AuthContext
) {
  try {
    if (!isToolAllowed(auth.role, name)) {
      return {
        error: `O perfil ${auth.role} não está autorizado a executar ${name}`
      }
    }
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

    return handler(argumentsData, auth)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao executar a ferramenta'
    }
  }
}

const functionTools: OpenAI.Responses.Tool[] = [
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
  },

  {
    type: 'function',
    name: 'requestReservationCancellation',
    description: `
    Solicita o cancelamento de uma reserva.

    Esta ferramenta não cancela a reserva imediatamente.
    Ela cria uma solicitação pendente que precisa ser
    aprovada por um gerente.

    Informe ao usuário o ID da aprovação retornada.
  `,
    parameters: {
      type: 'object',
      properties: {
        reservationId: {
          type: 'string',
          description: 'ID da reserva que será cancelada'
        }
      },
      required: ['reservationId'],
      additionalProperties: false
    },
    strict: true
  }
]

function getVectorStoreIdsForRole(
  role: UserRole
): string[] {
  if (role === 'guest') {
    return [
      publicVectorStoreId
    ]
  }

  return [
    publicVectorStoreId,
    internalVectorStoreId
  ]
}

function getToolsForRole(
  role: UserRole
): OpenAI.Responses.Tool[] {
  const allowedFunctionTools =
    functionTools.filter(tool => {
      if (tool.type !== 'function') {
        return false
      }

      return isToolAllowed(role, tool.name)
    })

  const fileSearchTool:
    OpenAI.Responses.FileSearchTool = {
    type: 'file_search',
    vector_store_ids:
      getVectorStoreIdsForRole(role),
    max_num_results: 3
  }

  return [
    ...allowedFunctionTools,
    fileSearchTool
  ]
}

const MAX_ROUNDS = 5
const MAX_TOOL_CALLS = 10

const conversations = new Map<
  string,
  OpenAI.Responses.ResponseInput
>()

export async function runAgent(
  question: string,
  conversationId: string,
  auth: AuthContext
): Promise<string> {
  const conversationKey =
    `${auth.userId}:${conversationId}`

  const previousInput =
    conversations.get(conversationKey) ?? []

  const input: OpenAI.Responses.ResponseInput = [
    ...previousInput,
    {
      role: 'user',
      content: question
    }
  ]

  let round = 0
  let toolCalls = 0

  while (round < MAX_ROUNDS) {
    round++

    console.log(`RODADA ${round}`)

    const response = await client.responses.create({
      model,
      instructions: `
        Você é o assistente da Pousada Parnaioca.

        Use as function tools quando precisar consultar dados
        estruturados, como hóspedes, reservas e quartos.

        Use file_search quando precisar consultar políticas,
        regras, passeios, perguntas frequentes ou procedimentos
        documentados da pousada.

        Não invente informações sobre hóspedes, reservas,
        políticas ou procedimentos.

        Quando os documentos não contiverem a informação,
        diga que ela não foi encontrada.
      `,
      input,
      tools: getToolsForRole(auth.role),
      include: [
        'file_search_call.results'
      ]
    })

    input.push(
      ...toResponseInputItems(response.output)
    )

    let hasFunctionCall = false

    for (const item of response.output) {
      if (item.type === 'file_search_call') {
        console.log('FILE SEARCH', {
          queries: item.queries,

          results: item.results?.map(result => ({
            filename: result.filename,
            score: result.score,
            text: result.text
          }))
        })

        continue
      }

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
        item.arguments,
        auth,
      )

      console.log('TOOL RESULT', toolResult)

      input.push({
        type: 'function_call_output',
        call_id: item.call_id,
        output: JSON.stringify(toolResult)
      })
    }

    if (!hasFunctionCall) {
      conversations.set(conversationKey, input)

      return response.output_text
    }
  }

  throw new Error(
    `O agente não terminou após ${MAX_ROUNDS} rodadas`
  )
}
