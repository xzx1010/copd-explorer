import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { HotspotData, SpecimenData } from '../../types/content'
import { SpecimenViewer } from './SpecimenViewer'

const specimen: SpecimenData = {
  id: 'specimen_test',
  type: 'specimen',
  title: '肺部标本',
  image: '/content/specimen.svg',
  altText: '肺部标本示意图',
  hotspots: ['hotspot_test'],
}

const hotspot: HotspotData = {
  id: 'hotspot_test',
  label: '气道狭窄',
  anchor: 'anchor_annotation_1',
  x: 0.2,
  y: 0.3,
  width: 0.2,
  height: 0.2,
}

describe('SpecimenViewer', () => {
  it('does not render overlays before the image loads', () => {
    render(
      <SpecimenViewer
        hotspots={[hotspot]}
        onSelectHotspot={vi.fn()}
        specimen={specimen}
      />,
    )

    expect(
      screen.queryByRole('button', { name: '气道狭窄' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('正在加载标本图像')
  })

  it('renders and selects overlays after the image loads', async () => {
    const onSelectHotspot = vi.fn()
    render(
      <SpecimenViewer
        hotspots={[hotspot]}
        onSelectHotspot={onSelectHotspot}
        specimen={specimen}
      />,
    )

    fireEvent.load(screen.getByRole('img', { name: '肺部标本示意图' }))
    const button = await screen.findByRole('button', { name: '气道狭窄' })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(onSelectHotspot).toHaveBeenCalledWith(hotspot)
  })

  it('keeps overlays hidden when the image fails', () => {
    render(
      <SpecimenViewer
        hotspots={[hotspot]}
        onSelectHotspot={vi.fn()}
        specimen={specimen}
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: '肺部标本示意图' }))

    expect(screen.getByRole('alert')).toHaveTextContent('热区已暂停显示')
    expect(
      screen.queryByRole('button', { name: '气道狭窄' }),
    ).not.toBeInTheDocument()
  })
})
