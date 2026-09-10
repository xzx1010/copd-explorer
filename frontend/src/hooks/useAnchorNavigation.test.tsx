import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useAnchorNavigation } from './useAnchorNavigation'

function createWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    )
  }
}

describe('useAnchorNavigation', () => {
  it('returns the default anchor when no query param is present', () => {
    const { result } = renderHook(
      () => useAnchorNavigation('anchor_specimen'),
      { wrapper: createWrapper(['/']) },
    )

    expect(result.current.currentAnchor).toBe('anchor_specimen')
    expect(result.current.rawAnchor).toBe('anchor_specimen')
  })

  it('reads a valid anchor from the URL query string', () => {
    const { result } = renderHook(
      () => useAnchorNavigation('anchor_specimen'),
      { wrapper: createWrapper(['/explorer?anchor=anchor_annotation_1']) },
    )

    expect(result.current.currentAnchor).toBe('anchor_annotation_1')
  })

  it('returns null for an invalid anchor format', () => {
    const { result } = renderHook(
      () => useAnchorNavigation('anchor_specimen'),
      { wrapper: createWrapper(['/explorer?anchor=bad!format']) },
    )

    expect(result.current.currentAnchor).toBeNull()
    expect(result.current.rawAnchor).toBe('bad!format')
  })

  it('falls back to default when anchor is empty', () => {
    const { result } = renderHook(
      () => useAnchorNavigation('anchor_specimen'),
      { wrapper: createWrapper(['/explorer?anchor=']) },
    )

    expect(result.current.currentAnchor).toBe('anchor_specimen')
  })

  it('provides navigateToAnchor that updates the URL', () => {
    const { result } = renderHook(
      () => useAnchorNavigation('anchor_specimen'),
      { wrapper: createWrapper(['/explorer']) },
    )

    act(() => {
      result.current.navigateToAnchor('anchor_annotation_2')
    })

    expect(result.current.currentAnchor).toBe('anchor_annotation_2')
  })
})
