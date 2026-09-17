import express, { Request, Response } from 'express'
import { bedrooms, getPopulatedReservations, guests } from './data/index.js'
import { reviewAnalyzeSchema } from './review.schema.js'
import OpenAI from "openai";
import 'dotenv/config'
import { zodTextFormat } from 'openai/helpers/zod.mjs';

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



const context: any = []

// 272k context window

app.post('/chat', async (req: Request, res: Response) => {
  const message = req.body.message

  if (!message) {
    res.status(400).json({
      error: 'É necessário que tenha pelo menos uma mensagem'
    })

    return
  }

  const response = await client.responses.create({
    model: 'gpt-5.6-luna',
    //   instructions: `
    //     Você é o assistente virtual da Pousada Parnaioca.

    //     Responda sempre em português.

    //     Responda somente a perguntas relacionadas à pousada,
    //     hospedagem, reservas, quartos e serviços turísticos relacionadas à Pousada Parnaioca.

    //     Quando uma pergunta depender de dados que não foram
    //     fornecidos no contexto, diga claramente que não possui
    //     acesso a essa informação.

    //     Não invente informações sobre hóspedes, reservas,
    //     quartos, preços, políticas ou serviços.

    //     Não responda à nenhuma pergunta que não esteja no contexto da Pousada Parnaioca.
    // `,
    input: [
      ...context,
      {
        role: 'user',
        content: message
      }
    ]
  })

  context.push({
    role: 'user',
    content: message
  })

  context.push({
    role: 'assistant',
    content: response.output_text
  })

  res.json({
    message: 'Resposta gerada',
    data: response.output_text
  })
})

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})
