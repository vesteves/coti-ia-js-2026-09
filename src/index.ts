import express, { Request, Response } from 'express'
import { bedrooms, getPopulatedReservations, guests } from './data/index.js'

const app = express()

const port = Number(process.env.PORT) || 8000

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

app.listen(port, () => {
  console.log(`Servidor ON! http://localhost:${port}`)
})
