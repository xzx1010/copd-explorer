import { z } from 'zod'

import {
  annotationDataSchema,
  clinicalDataSchema,
  explorerContextSchema,
  homePageContentSchema,
  mechanismDataSchema,
  slideDataSchema,
  specimenDataSchema,
} from '../types/content'

export const specimenValueSchema = specimenDataSchema
export const slideValueSchema = slideDataSchema
export const annotationValueSchema = annotationDataSchema
export const mechanismValueSchema = mechanismDataSchema
export const clinicalValueSchema = clinicalDataSchema
export const explorerContextValueSchema = explorerContextSchema
export const homePageContentValueSchema = homePageContentSchema

export const contentValidationSchema = z
  .object({
    specimen: specimenDataSchema.optional(),
    slide: slideDataSchema.optional(),
    annotation: annotationDataSchema.optional(),
    mechanism: mechanismDataSchema.optional(),
    clinical: clinicalDataSchema.optional(),
  })
  .strict()
