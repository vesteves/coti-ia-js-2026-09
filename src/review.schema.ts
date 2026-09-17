import { z } from 'zod'

export const reviewAnalyzeSchema = z.object({
  sentiment: z.enum([
    'positive',
    'neutral',
    'negative'
  ]),
  category: z.enum([
    'cleanliness',
    'service',
    'food',
    'location',
    'other'
  ]),
  priority: z.enum([
    'low',
    'medium',
    'high'
  ])
})

export type ReviewAnalysis = z.infer<typeof reviewAnalyzeSchema>