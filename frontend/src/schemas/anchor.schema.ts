import { z } from 'zod'

import {
  anchorIdSchema,
  anchorItemSchema,
  anchorTypeSchema,
} from '../types/anchor'

export const anchorTypeEnumSchema = anchorTypeSchema
export const anchorIdValueSchema = anchorIdSchema
export const anchorItemValueSchema = anchorItemSchema

export const anchorItemValidationSchema = z
  .object({
    id: anchorIdSchema,
    type: anchorTypeSchema,
    name: z.string().trim().min(1),
    links: z.record(z.string(), anchorIdSchema).optional(),
  })
  .strict()

export type AnchorItemSchema = z.infer<typeof anchorItemValidationSchema>
