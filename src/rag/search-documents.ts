import 'dotenv/config'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const audience = process.argv[2]
const question = process.argv.slice(3).join(' ').trim()

if (audience !== 'public' && audience !== 'internal') {
  throw new Error(
    'Informe o tipo da base: public ou internal'
  )
}

if (!question) {
  throw new Error('Informe uma pergunta para a busca')
}

const vectorStoreId =
  audience === 'public'
    ? process.env.OPENAI_PUBLIC_VECTOR_STORE_ID
    : process.env.OPENAI_INTERNAL_VECTOR_STORE_ID

if (!vectorStoreId) {
  throw new Error(
    `O vector store ${audience} não foi configurado no .env`
  )
}

const client = new OpenAI({ apiKey })

const results = await client.vectorStores.search(
  vectorStoreId,
  {
    query: question,
    max_num_results: 3,
    rewrite_query: true
  }
)

if (results.data.length === 0) {
  console.log('Nenhum trecho relevante encontrado.')
}

for (const [index, result] of results.data.entries()) {
  console.log(`\nRESULTADO ${index + 1}`)
  console.log(`Arquivo: ${result.filename}`)
  console.log(`Similaridade: ${result.score}`)

  for (const content of result.content) {
    console.log(content.text)
  }
}
