import type { Bedroom } from '../types.js'

type BedroomsResponse = {
  message: string
  data: Bedroom[]
}

async function listBedroomsFromApi(): Promise<Bedroom[]> {
  console.log('TOOL listBedroomsFromApi EXECUTADA')

  const response = await fetch(
    'http://localhost:8000/bedrooms'
  )

  if (!response.ok) {
    throw new Error(
      `A API respondeu com HTTP ${response.status}`
    )
  }

  const body = await response.json() as BedroomsResponse

  return body.data
}

const bedrooms = await listBedroomsFromApi()

console.table(
  bedrooms.map((bedroom) => ({
    id: bedroom.id,
    name: bedroom.name,
    capacity: bedroom.capacity,
    price: bedroom.price
  }))
)
