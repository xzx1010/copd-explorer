import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { parseAnchor } from '../services/anchor'

/**
 * Shared anchor read/write logic for pages that drive content via URL anchor.
 *
 * - Reads the current anchor from `?anchor=...`, falling back to `defaultAnchor`.
 * - Provides a `navigateToAnchor` function that pushes each learning step into
 *   browser history so back/forward can restore prior anchors.
 * - Validates the anchor format with Zod; returns `null` when invalid so pages
 *   can show a friendly recovery path.
 */
export function useAnchorNavigation(defaultAnchor: string) {
  const location = useLocation()
  const navigate = useNavigate()

  const rawAnchor = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const anchor = params.get('anchor')?.trim()
    return anchor && anchor.length > 0 ? anchor : defaultAnchor
  }, [location.search, defaultAnchor])

  const currentAnchor = useMemo(() => {
    const parsed = parseAnchor(rawAnchor)
    return parsed.valid ? parsed.anchorId! : null
  }, [rawAnchor])

  const navigateToAnchor = useCallback(
    (anchor: string) => {
      const params = new URLSearchParams(location.search)
      params.set('anchor', anchor)
      navigate({ search: `?${params.toString()}` })
    },
    [location.search, navigate],
  )

  return { currentAnchor, rawAnchor, navigateToAnchor }
}
