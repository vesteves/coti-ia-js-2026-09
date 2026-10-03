import 'dotenv/config'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error(
    'OPENAI_API_KEY não foi configurada'
  )
}

const vectorStoreId =
  process.env.OPENAI_PUBLIC_VECTOR_STORE_ID

if (!vectorStoreId) {
  throw new Error(
    'OPENAI_PUBLIC_VECTOR_STORE_ID não foi configurado'
  )
}

const model =
  process.env.OPENAI_MODEL || 'gpt-5.6-luna'

const client = new OpenAI({ apiKey })

const question =
  process.argv.slice(2).join(' ').trim()

if (!question) {
  throw new Error('Informe uma pergunta')
}

const response = await client.responses.create({
  model,

  instructions: `
    Você é o assistente da Pousada Parnaioca.

    Responda perguntas sobre as políticas e os serviços
    da pousada usando os documentos disponíveis.

    Não invente regras ou informações.
    Se os documentos não forem suficientes, diga que
    não encontrou a informação.
  `,

  input: question,

  tools: [
    {
      type: 'file_search',
      vector_store_ids: [vectorStoreId],
      max_num_results: 3
    }
  ],

  include: [
    'file_search_call.results'
  ]
})

console.log('RESPOSTA')
console.log(response.output_text)

console.log('\nOUTPUT COMPLETO')
console.dir(response.output, {
  depth: null
})