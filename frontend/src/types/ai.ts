import { z } from 'zod'

import { anchorIdSchema } from './anchor'

export const aiAssessmentSchema = z
  .object({
    disease: z.string().trim().min(1),
    likelihood: z.enum(['low', 'medium', 'high', 'unknown']),
    confidence: z.number().min(0).max(1),
    basis: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()
export type AIAssessment = z.infer<typeof aiAssessmentSchema>

export const aiEvidenceSchema = z
  .object({
    text: z.string().trim().min(1),
    anchorId: anchorIdSchema,
  })
  .strict()
export type AIEvidence = z.infer<typeof aiEvidenceSchema>

export const aiResultSchema = z
  .object({
    assessment: aiAssessmentSchema,
    evidence: z.array(aiEvidenceSchema).min(1),
    differential: z.array(z.string().trim().min(1)),
    recommendation: z.array(z.string().trim().min(1)),
    disclaimer: z.string().trim().min(1),
  })
  .strict()
export type AIResult = z.infer<typeof aiResultSchema>

export const aiAnalyzeRequestSchema = z
  .object({
    patientInfo: z
      .object({
        age: z.number().int().positive(),
        sex: z.string().trim().min(1),
        smokingHistory: z.string().trim().min(1),
      })
      .strict(),
    symptoms: z.array(z.string().trim().min(1)).min(1),
    tests: z
      .object({
        lungFunction: z.string().trim().min(1).optional(),
        ctDescription: z.string().trim().min(1).optional(),
      })
      .strict(),
    pathologyContext: z.array(z.string().trim().min(1)),
  })
  .strict()
export type AIAnalyzeRequest = z.infer<typeof aiAnalyzeRequestSchema>
