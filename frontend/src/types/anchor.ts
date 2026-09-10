import { z } from 'zod'

export const anchorTypeValues = [
  'specimen',
  'slide',
  'annotation',
  'mechanism',
  'clinical',
  'ai_evidence',
] as const
export const anchorTypeSchema = z.enum(anchorTypeValues)
export type AnchorType = z.infer<typeof anchorTypeSchema>

export const anchorIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9_]+$/, 'Anchor IDs must be lowercase snake_case')
export type AnchorId = z.infer<typeof anchorIdSchema>

export const anchorItemSchema = z
  .object({
    id: anchorIdSchema,
    type: anchorTypeSchema,
    name: z.string().trim().min(1),
    links: z.record(z.string(), anchorIdSchema).optional(),
  })
  .strict()

export type AnchorItem = z.infer<typeof anchorItemSchema>
