import { z } from 'zod'

export const chatSchema = z.object({
  message: z.string({
    error: 'O campo message deve ser um texto'
  }).trim().min(1, {
    error: 'O campo message é obrigatório'
  }),

  conversationId: z.string({
    error: 'O campo conversationId deve ser um texto'
  }).trim().min(1, {
    error: 'O campo conversationId é obrigatório'
  })
})
