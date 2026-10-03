import express, { Request, Response } from 'express'
import 'dotenv/config'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import {
  validationMiddleware
} from './validation.middleware.js'
import {
  analyzeReviewSchema,
  reviewAnalysisSchema
} from './review.schema.js'
import { chatSchema } from './chat.schema.js'
import { bedrooms, getPopulatedReservations, guests } from './data/index.js'
import { runAgent } from './tool-calling.js'
import { authMiddleware } from './auth.middleware.js'
import {
  decideCancellation
} from './approval.store.js'

const app = express()

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({
  apiKey
})

const port = Number(process.env.PORT) || 8000
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    message: 'Servidor funcionando',
    data: { status: 'ok' }
  })
})

app.get('/guests', (_req: Request, res: Response) => {
  res.json({
    message: 'Hóspedes listados com sucesso',
    data: guests
  })
})

app.get('/bedrooms', (_req: Request, res: Response) => {
  res.json({
    message: 'Quartos listados com sucesso',
    data: bedrooms
  })
})

app.get('/reservations', (_req: Request, res: Response) => {
  res.json({
    message: 'Reservas listadas com sucesso',
    data: getPopulatedReservations()
  })
})

app.post(
  '/chat',
  authMiddleware,
  validationMiddleware(chatSchema),
  async (_req: Request, res: Response) => {
    const answer = await runAgent(
      res.locals.validation.message,
      res.locals.validation.conversationId,
      res.locals.auth
    )

    res.json({
      message: 'Resposta gerada com sucesso',
      data: answer
    })
  })

app.post(
  '/reviews/analyze',
  validationMiddleware(analyzeReviewSchema),
  async (_req: Request, res: Response) => {
    const response = await client.responses.parse({
      model,
      instructions: `
      Você analisa avaliações dos hóspedes da Pousada Parnaioca.

      Quando houver elogios e reclamações na mesma avaliação,
      considere o impacto do problema na experiência do hóspede.

      Quando mais de uma categoria estiver presente,
      escolha aquela relacionada ao problema de maior impacto.
    `,
      input: [
        {
          role: 'user',
          content: 'O quarto estava impecável e a equipe foi muito atenciosa.'
        },
        {
          role: 'assistant',
          content: `{
        "sentiment": "positive",
        "category": "cleanliness",
        "priority": "low"
      }`
        },
        {
          role: 'user',
          content: 'A praia é linda, mas esperei duas horas para conseguir entrar no quarto.'
        },
        {
          role: 'assistant',
          content: `{
        "sentiment": "negative",
        "category": "service",
        "priority": "high"
      }`
        },
        {
          role: 'user',
          content: res.locals.validation.review
        }
      ],
      text: {
        format: zodTextFormat(
          reviewAnalysisSchema,
          'review_analysis'
        )
      }
    })

    if (!response.output_parsed) {
      res.status(422).json({
        message: 'Não foi possível analisar a avaliação',
        data: null
      })

      return
    }

    res.json({
      message: 'Avaliação analisada com sucesso',
      data: response.output_parsed
    })
  })

app.post(
  '/approvals/:approvalId',
  authMiddleware,
  (req: Request, res: Response) => {
    const auth = res.locals.auth

    if (auth.role !== 'manager') {
      res.status(403).json({
        message:
          'Somente um gerente pode decidir esta solicitação',
        data: null
      })

      return
    }

    const decision = req.body.decision

    if (
      decision !== 'approved' &&
      decision !== 'rejected'
    ) {
      res.status(400).json({
        message:
          'A decisão deve ser approved ou rejected',
        data: null
      })

      return
    }

    try {
      const result = decideCancellation(
        req.params.approvalId as string,
        decision,
        auth.userId
      )

      res.json({
        message: `Cancelamento ${decision}`,
        data: result
      })
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao processar aprovação',
        data: null
      })
    }
  }
)

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})
