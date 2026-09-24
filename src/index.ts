import express, { Request, Response } from 'express'
import { bedrooms, getPopulatedReservations, guests } from './data/index.js'
import { reviewAnalyzeSchema } from './review.schema.js'
import {
  validationMiddleware
} from './validation.middleware.js'
import OpenAI from "openai";
import 'dotenv/config'
import { zodTextFormat } from 'openai/helpers/zod.mjs';
import { runAgent } from './tool-calling.js';
import { chatSchema } from './chat.schema.js';

const app = express()

const port = Number(process.env.PORT) || 8000

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

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

app.post('/review/analyze', async (req: Request, res: Response) => {
  const message = req.body.review

  if (!message) {
    res.status(400).json({
      error: 'É necessário que tenha pelo menos uma mensagem'
    })

    return
  }

  // Few Shot
  const response = await client.responses.parse({
    model: 'gpt-5.6-luna',
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
        content: message
      }
    ],
    text: {
      format: zodTextFormat(
        reviewAnalyzeSchema,
        'review_analysis'
      )
    }
  })

  console.log(response.usage)

  // const data = JSON.parse(response.output_text)
  // console.log(data.category)

  res.json({
    message: 'Resposta gerada',
    data: response.output_parsed
  })
})


// 272k context window

app.post('/chat', validationMiddleware(chatSchema), async (req: Request, res: Response) => {
  const message = res.locals.validation.message
  const conversationId = res.locals.validation.conversationId

  const response = await runAgent(message, conversationId)

  res.json({
    message: 'Resposta gerada',
    data: response
  })
})

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})
