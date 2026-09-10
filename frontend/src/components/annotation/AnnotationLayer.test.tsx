import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AnnotationData } from '../../types/content'
import { AnnotationLayer } from './AnnotationLayer'

const annotation1: AnnotationData = {
  id: 'annotation_1',
  type: 'annotation',
  name: '气道狭窄',
  description: '气道腔被炎症和黏液堵塞所缩窄。',
  anchor: 'anchor_annotation_1',
  slidePosition: { x: 0.15, y: 0.2, width: 0.25, height: 0.25 },
  links: { slide: 'anchor_slide_1' },
}

const annotation2: AnnotationData = {
  id: 'annotation_2',
  type: 'annotation',
  name: '黏液堵塞',
  description: '黏液积聚和杯状细胞增生较为明显。',
  anchor: 'anchor_annotation_2',
  slidePosition: { x: 0.4, y: 0.35, width: 0.25, height: 0.2 },
  links: { slide: 'anchor_slide_2' },
}

const annotations = [annotation1, annotation2]

describe('AnnotationLayer', () => {
  it('shows empty state when there are no annotations', () => {
    render(<AnnotationLayer annotations={[]} onSelectAnnotation={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('暂无标注区域')
  })

  it('renders markers for each annotation with normalized positioning', () => {
    render(
      <AnnotationLayer
        annotations={annotations}
        onSelectAnnotation={vi.fn()}
      />,
    )

    const marker = screen.getByRole('button', { name: '气道狭窄' })
    expect(marker).toHaveStyle({
      left: '15%',
      top: '20%',
      width: '25%',
      height: '25%',
    })
  })

  it('supports selection via mouse click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <AnnotationLayer
        annotations={annotations}
        onSelectAnnotation={onSelect}
      />,
    )

    await user.click(screen.getByRole('button', { name: '气道狭窄' }))
    expect(onSelect).toHaveBeenCalledWith(annotation1)
  })

  it('supports keyboard selection with Enter and Space', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <AnnotationLayer
        annotations={annotations}
        onSelectAnnotation={onSelect}
      />,
    )

    const marker = screen.getByRole('button', { name: '黏液堵塞' })
    marker.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(annotation2)
  })

  it('shows selected state with aria-pressed and data attribute', () => {
    render(
      <AnnotationLayer
        annotations={annotations}
        onSelectAnnotation={vi.fn()}
        selectedAnchor="anchor_annotation_1"
      />,
    )

    const marker = screen.getByRole('button', {
      name: /气道狭窄（已选中）/i,
    })
    expect(marker).toHaveAttribute('aria-pressed', 'true')
    expect(marker).toHaveAttribute('data-selected', 'true')
  })

  it('skips annotations without slidePosition', () => {
    const noPosAnnotation: AnnotationData = {
      id: 'annotation_nopos',
      type: 'annotation',
      name: '无坐标标注',
      description: '没有位置信息',
      anchor: 'anchor_nopos',
      links: {},
    }

    render(
      <AnnotationLayer
        annotations={[noPosAnnotation]}
        onSelectAnnotation={vi.fn()}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('暂无标注区域')
  })
})
