import 'dotenv/config'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY não foi configurada')
}

const client = new OpenAI({ apiKey })

const publicDocuments = [
  'cancelamento.pdf',
  'politica-hospedagem.pdf',
  'passeios.pdf',
  'faq.pdf'
]

const internalDocuments = [
  'manual-funcionarios.pdf'
]

async function uploadDocuments(fileNames: string[]) {
  return Promise.all(
    fileNames.map(async fileName => {
      console.log(`Enviando ${fileName}`)

      return client.files.create({
        file: createReadStream(
          resolve('docs', fileName)
        ),
        purpose: 'assistants'
      })
    })
  )
}

async function createKnowledgeBase(
  name: string,
  fileNames: string[]
) {
  const files = await uploadDocuments(fileNames)

  const vectorStore = await client.vectorStores.create({
    name,
    expires_after: {
      anchor: 'last_active_at',
      days: 30
    }
  })

  console.log(`Processando documentos em ${name}`)

  const batch = await client.vectorStores.fileBatches.createAndPoll(
    vectorStore.id,
    {
      file_ids: files.map(file => file.id),
      chunking_strategy: {
        type: 'static',
        static: {
          max_chunk_size_tokens: 800,
          chunk_overlap_tokens: 200
        }
      }
    }
  )

  if (batch.status !== 'completed') {
    throw new Error(
      `A ingestão de ${name} terminou com status ${batch.status}`
    )
  }

  if (batch.file_counts.failed > 0) {
    throw new Error(
      `${batch.file_counts.failed} arquivo(s) falharam em ${name}`
    )
  }

  return vectorStore
}

const publicStore = await createKnowledgeBase(
  'Parnaioca - Documentos públicos',
  publicDocuments
)

const internalStore = await createKnowledgeBase(
  'Parnaioca - Documentos internos',
  internalDocuments
)

console.log('\nIngestão concluída.')
console.log('Adicione ao arquivo .env:')
console.log(
  `OPENAI_PUBLIC_VECTOR_STORE_ID=${publicStore.id}`
)
console.log(
  `OPENAI_INTERNAL_VECTOR_STORE_ID=${internalStore.id}`
)
