import OpenAI from "openai";
import 'dotenv/config'
import { guests, reservations, bedrooms } from './data/index.js'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

const context = [
  guests,
  reservations,
  bedrooms
]

const response = await client.responses.create({
  model: 'gpt-5.6-luna',
  input: `
  Dados da Pousada Parnaioca:

  ${JSON.stringify(context)}

  Pergunta: De acordo com os dados, sugira quando o João Silva fará uma nova reserva além das que estão nos dados.
  `
})

console.log(response.output_text)
console.log(response.usage)
