import { z } from 'zod'

import { anchorIdSchema, anchorItemSchema } from './anchor'

export const normalizedCoordinateSchema = z.number().min(0).max(1)
export type NormalizedCoordinate = z.infer<typeof normalizedCoordinateSchema>

export const hotspotDataSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    anchor: anchorIdSchema,
    x: normalizedCoordinateSchema,
    y: normalizedCoordinateSchema,
    width: normalizedCoordinateSchema,
    height: normalizedCoordinateSchema,
  })
  .strict()
export type HotspotData = z.infer<typeof hotspotDataSchema>

export const specimenDataSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('specimen'),
    title: z.string().trim().min(1),
    image: z.string().trim().min(1),
    altText: z.string().trim().min(1).optional(),
    hotspots: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()
export type SpecimenData = z.infer<typeof specimenDataSchema>

export const slideDataSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('slide'),
    title: z.string().trim().min(1),
    image: z.string().trim().min(1),
    altText: z.string().trim().min(1).optional(),
    anchor: anchorIdSchema,
  })
  .strict()
export type SlideData = z.infer<typeof slideDataSchema>

export const slidePositionSchema = z
  .object({
    x: normalizedCoordinateSchema,
    y: normalizedCoordinateSchema,
    width: normalizedCoordinateSchema,
    height: normalizedCoordinateSchema,
  })
  .strict()
export type SlidePosition = z.infer<typeof slidePositionSchema>

export const annotationDataSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('annotation'),
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    anchor: anchorIdSchema,
    slidePosition: slidePositionSchema.optional(),
    links: z
      .object({
        specimen: anchorIdSchema.optional(),
        slide: anchorIdSchema.optional(),
        mechanism: anchorIdSchema.optional(),
        clinical: anchorIdSchema.optional(),
      })
      .strict(),
  })
  .strict()
export type AnnotationData = z.infer<typeof annotationDataSchema>

export const mechanismDataSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('mechanism'),
    title: z.string().trim().min(1),
    anchor: anchorIdSchema,
    summary: z.string().trim().min(1),
    nodes: z
      .array(
        z
          .object({
            id: z.string().trim().min(1),
            title: z.string().trim().min(1),
            description: z.string().trim().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
export type MechanismData = z.infer<typeof mechanismDataSchema>

export const clinicalDataSchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.literal('clinical'),
    title: z.string().trim().min(1),
    anchor: anchorIdSchema,
    summary: z.string().trim().min(1),
    impact: z.string().trim().min(1),
    symptoms: z.array(z.string().trim().min(1)).min(1),
    treatment: z.array(z.string().trim().min(1)).min(1),
    prevention: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()
export type ClinicalData = z.infer<typeof clinicalDataSchema>

export const explorerContextSchema = z
  .object({
    anchor: anchorIdSchema,
    specimen: specimenDataSchema.optional().nullable(),
    hotspots: z.array(hotspotDataSchema).default([]),
    slide: slideDataSchema.optional().nullable(),
    slideAnnotations: z.array(annotationDataSchema).default([]),
    annotation: annotationDataSchema.optional().nullable(),
    mechanism: mechanismDataSchema.optional().nullable(),
    clinical: clinicalDataSchema.optional().nullable(),
  })
  .strict()
export type ExplorerContext = z.infer<typeof explorerContextSchema>

export const homePageContentSchema = z
  .object({
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    learningPath: z.array(anchorItemSchema),
  })
  .strict()
export type HomePageContent = z.infer<typeof homePageContentSchema>
