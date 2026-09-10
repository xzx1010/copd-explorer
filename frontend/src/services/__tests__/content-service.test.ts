import { describe, expect, it } from 'vitest'

import { defaultContentBundle } from '../../data/content'
import { StaticContentRepository } from '../content'
import { hasAnchor, parseAnchor, isAnchorType } from '../anchor'
import type { AnchorType } from '../../types/anchor'

describe('content service', () => {
  it('returns the default explorer context for the default anchor', async () => {
    const repository = new StaticContentRepository(defaultContentBundle)
    const context = await repository.getContext('anchor_specimen')

    expect(context.anchor).toBe('anchor_specimen')
    expect(context.specimen?.id).toBe('specimen_1')
    expect(context.hotspots.length).toBe(3)
  })

  it('returns a null context for an invalid anchor', async () => {
    const repository = new StaticContentRepository(defaultContentBundle)
    const context = await repository.getContext('missing_anchor')

    expect(context.anchor).toBe('missing_anchor')
    expect(context.specimen).toBeNull()
    expect(context.slide).toBeNull()
  })

  it('aggregates hotspot coordinates correctly', async () => {
    const repository = new StaticContentRepository(defaultContentBundle)
    const context = await repository.getContext('anchor_specimen')

    const hotspot = context.hotspots.find((h) => h.id === 'hotspot_1')
    expect(hotspot).toBeDefined()
    expect(hotspot!.x).toBe(0.2)
    expect(hotspot!.y).toBe(0.3)
    expect(hotspot!.width).toBe(0.2)
    expect(hotspot!.height).toBe(0.2)
    // Anchor must be a valid annotation anchor
    expect(hotspot!.anchor).toBe('anchor_annotation_1')
  })

  it('resolves slide annotations for a given slide', async () => {
    const repository = new StaticContentRepository(defaultContentBundle)
    // anchor_annotation_1 links to slide anchor_slide_1
    const context = await repository.getContext('anchor_annotation_1')

    expect(context.slideAnnotations.length).toBe(1)
    expect(context.slideAnnotations[0]!.id).toBe('annotation_1')
    expect(context.slideAnnotations[0]!.slidePosition).toBeDefined()
  })

  it('resolves fallback mechanism and clinical from annotation links', async () => {
    const repository = new StaticContentRepository(defaultContentBundle)
    const context = await repository.getContext('anchor_annotation_1')

    // mechanism and clinical are resolved via annotation.links
    expect(context.mechanism?.id).toBe('mechanism_1')
    expect(context.clinical?.id).toBe('clinical_1')
  })
})

describe('anchor service', () => {
  it('parses and checks anchors reliably', () => {
    const parsed = parseAnchor('anchor_annotation_1')
    expect(parsed.valid).toBe(true)
    expect(parsed.type).toBe('annotation')
    expect(hasAnchor('anchor_annotation_1', defaultContentBundle.anchors)).toBe(
      true,
    )
  })

  it.each([
    ['anchor_specimen', 'specimen'],
    ['anchor_slide_1', 'slide'],
    ['anchor_annotation_1', 'annotation'],
    ['anchor_mechanism_1', 'mechanism'],
    ['anchor_clinical_1', 'clinical'],
  ])('detects %s as type %s', (id, expectedType) => {
    expect(isAnchorType(id, expectedType as AnchorType)).toBe(true)
  })

  it('rejects invalid anchor formats', () => {
    expect(parseAnchor('bad!format').valid).toBe(false)
    expect(parseAnchor('').valid).toBe(false)
    expect(parseAnchor('just-a-string_without_prefix').valid).toBe(false)
  })

  it('check that an unknown anchor is not found', () => {
    expect(hasAnchor('anchor_nope_99', defaultContentBundle.anchors)).toBe(
      false,
    )
  })
})
