import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { HotspotData } from '../../types/content'
import { HotspotMarker } from './HotspotMarker'

const hotspot: HotspotData = {
  id: 'hotspot_test',
  label: '气道狭窄',
  anchor: 'anchor_annotation_1',
  x: 0.2,
  y: 0.3,
  width: 0.2,
  height: 0.2,
}

describe('HotspotMarker', () => {
  it('selects with mouse and exposes normalized positioning', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<HotspotMarker hotspot={hotspot} onSelect={onSelect} />)
    const marker = screen.getByRole('button', { name: '气道狭窄' })

    expect(marker).toHaveStyle({
      left: '20%',
      top: '30%',
      width: '20%',
      height: '20%',
    })
    await user.click(marker)
    expect(onSelect).toHaveBeenCalledWith(hotspot)
  })

  it.each(['{Enter}', ' '])(
    'selects with %s and gives non-color selected feedback',
    async (key) => {
      const user = userEvent.setup()
      const onSelect = vi.fn()

      render(<HotspotMarker hotspot={hotspot} onSelect={onSelect} selected />)
      const marker = screen.getByRole('button', { name: /气道狭窄.*已选中/i })

      expect(marker).toHaveAttribute('aria-pressed', 'true')
      await user.tab()
      await user.keyboard(key)
      expect(onSelect).toHaveBeenCalledWith(hotspot)
    },
  )

  it('supports disabled state', () => {
    render(<HotspotMarker disabled hotspot={hotspot} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: '气道狭窄' })).toBeDisabled()
  })
})
