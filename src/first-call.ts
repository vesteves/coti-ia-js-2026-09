import 'dotenv/config'
import OpenAI from 'openai'
import { guests, reservations } from './data/index.js'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({
  apiKey
})

const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const context = {
  guests,
  reservations
}

const firstResponse = await client.responses.create({
  model,
  input: `
    Dados da Pousada Parnaioca:

    ${JSON.stringify(context)}

    Pergunta: O João Silva possui alguma reserva?
  `
})

console.log('PRIMEIRA RESPOSTA')
console.log(firstResponse.output_text)

const secondResponse = await client.responses.create({
  model,
  input: 'Qual é o nome do quarto da próxima reserva de João Silva?'
})

console.log('SEGUNDA RESPOSTA')
console.log(secondResponse.output_text)
