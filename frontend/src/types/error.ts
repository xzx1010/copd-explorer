import { z } from 'zod'

export const appErrorSchema = z
  .object({
    code: z.enum([
      'VALIDATION_ERROR',
      'NOT_FOUND',
      'NETWORK_ERROR',
      'TIMEOUT',
      'UNKNOWN',
    ]),
    message: z.string().trim().min(1),
    status: z.number().int().positive(),
    details: z.record(z.string(), z.string()).optional(),
  })
  .strict()

export type AppError = z.infer<typeof appErrorSchema>
