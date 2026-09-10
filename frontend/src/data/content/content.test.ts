import { describe, expect, it } from 'vitest'

import { defaultContentBundle, validateContentBundle } from './content'

describe('content bundle validation', () => {
  it('accepts the MVP content bundle', () => {
    const result = validateContentBundle(defaultContentBundle)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('detects a dangling anchor link', () => {
    const brokenBundle = structuredClone(defaultContentBundle)
    brokenBundle.annotations[0]!.links.slide = 'missing_slide'

    const result = validateContentBundle(brokenBundle)

    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('missing_slide'))).toBe(
      true,
    )
  })

  it('detects a missing default anchor', () => {
    const brokenBundle = structuredClone(defaultContentBundle)
    brokenBundle.anchors = brokenBundle.anchors.filter(
      (anchor) => anchor.type !== 'specimen',
    )

    const result = validateContentBundle(brokenBundle)

    expect(result.valid).toBe(false)
    expect(
      result.errors.some((error) => error.includes('missing_default_anchor')),
    ).toBe(true)
  })
})
