import {
  anchorIdSchema,
  anchorTypeSchema,
  type AnchorItem,
  type AnchorType,
} from '../types/anchor'

export type AnchorParseResult = {
  valid: boolean
  anchorId?: string
  type?: AnchorType
}

export interface AnchorService {
  parseAnchor(input: string): AnchorParseResult
  isAnchorType(input: string, expected: AnchorType): boolean
  buildLink(anchorId: string, target: string): string
  exists(anchorId: string): boolean
}

export function parseAnchor(input: string): AnchorParseResult {
  const parsed = anchorIdSchema.safeParse(input)
  if (!parsed.success) {
    return { valid: false }
  }

  const [, kind] = parsed.data.split('_')
  const type = anchorTypeSchema.safeParse(kind)

  const result: AnchorParseResult = {
    valid: true,
    anchorId: parsed.data,
  }
  if (type.success) {
    result.type = type.data
  }
  return result
}

export function isAnchorType(input: string, expected: AnchorType): boolean {
  const parsed = parseAnchor(input)
  if (!parsed.valid || !parsed.type) {
    return false
  }
  return parsed.type === expected
}

export function buildAnchorLink(anchorId: string, target: string): string {
  const normalizedAnchor = anchorIdSchema.parse(anchorId)
  const normalizedTarget = anchorIdSchema.parse(target)
  return `/explorer?anchor=${normalizedAnchor}&target=${normalizedTarget}`
}

export function hasAnchor(anchorId: string, anchors: AnchorItem[]): boolean {
  return anchors.some((anchor) => anchor.id === anchorId)
}

export function getAnchorType(anchorId: string): AnchorType | undefined {
  const parsed = parseAnchor(anchorId)
  return parsed.type
}
