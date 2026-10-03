import { z } from 'zod'

export const reviewAnalysisSchema = z.object({
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

export const analyzeReviewSchema = z.object({
  review: z.string({
    error: 'O campo review deve ser um texto'
  }).trim().min(1, {
    error: 'O campo review é obrigatório'
  })
})

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>
export type AnalyzeReview = z.infer<typeof analyzeReviewSchema>