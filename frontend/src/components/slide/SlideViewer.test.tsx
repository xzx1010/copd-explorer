import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { SlideData } from '../../types/content'
import { SlideViewer } from './SlideViewer'

const slide: SlideData = {
  id: 'slide_test',
  type: 'slide',
  title: '低倍组织学切片',
  image: '/content/slide-test.svg',
  altText: '低倍组织学切片示意图',
  anchor: 'anchor_slide_1',
}

describe('SlideViewer', () => {
  it('shows empty state when no slide is provided', () => {
    render(<SlideViewer slide={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('切片图像')
  })

  it('shows loading state before the image loads', () => {
    render(<SlideViewer slide={slide} />)
    expect(screen.getByRole('status')).toHaveTextContent('正在加载切片图像')
    expect(
      screen.queryByRole('button', { name: '放大' }),
    ).not.toBeInTheDocument()
  })

  it('renders controls after the image loads and supports zoom in', async () => {
    const user = userEvent.setup()
    render(<SlideViewer slide={slide} />)

    fireEvent.load(screen.getByRole('img', { name: '低倍组织学切片示意图' }))

    const zoomIn = await screen.findByRole('button', { name: '放大' })
    expect(zoomIn).toBeInTheDocument()

    const caption = screen.getByText(/缩放 1\.0×/)
    expect(caption).toBeInTheDocument()

    await user.click(zoomIn)
    expect(screen.getByText(/缩放 1\.5×/)).toBeInTheDocument()
  })

  it('supports zoom out down to 1.0× and resets pan', async () => {
    const user = userEvent.setup()
    render(<SlideViewer slide={slide} />)

    fireEvent.load(screen.getByRole('img', { name: '低倍组织学切片示意图' }))

    const zoomIn = await screen.findByRole('button', { name: '放大' })
    const zoomOut = screen.getByRole('button', { name: '缩小' })

    await user.click(zoomIn)
    await user.click(zoomIn)
    expect(screen.getByText(/缩放 2\.0×/)).toBeInTheDocument()

    await user.click(zoomOut)
    expect(screen.getByText(/缩放 1\.5×/)).toBeInTheDocument()
  })

  it('resets zoom and pan when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<SlideViewer slide={slide} />)

    fireEvent.load(screen.getByRole('img', { name: '低倍组织学切片示意图' }))

    const zoomIn = await screen.findByRole('button', { name: '放大' })
    await user.click(zoomIn)
    await user.click(zoomIn)

    const resetBtn = screen.getByRole('button', { name: '复位视图' })
    expect(resetBtn).not.toBeDisabled()
    await user.click(resetBtn)

    expect(screen.getByText(/缩放 1\.0×/)).toBeInTheDocument()
  })

  it('shows error state and retry button when image fails', () => {
    render(<SlideViewer slide={slide} />)

    fireEvent.error(screen.getByRole('img', { name: '低倍组织学切片示意图' }))

    expect(screen.getByRole('alert')).toHaveTextContent('切片图像暂时无法加载')
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
  })

  it('resets view when slide changes identity', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SlideViewer slide={slide} />)

    fireEvent.load(screen.getByRole('img', { name: '低倍组织学切片示意图' }))
    const zoomIn = await screen.findByRole('button', { name: '放大' })
    await user.click(zoomIn)
    expect(screen.getByText(/缩放 1\.5×/)).toBeInTheDocument()

    const newSlide: SlideData = {
      id: 'slide_other',
      type: 'slide',
      title: '高倍气道细节',
      image: '/content/slide-other.svg',
      altText: '高倍气道细节示意图',
      anchor: 'anchor_slide_2',
    }

    rerender(<SlideViewer slide={newSlide} />)
    expect(screen.getByRole('status')).toHaveTextContent('正在加载切片图像')
  })

  it('keep zoom-out disabled and reset disabled at 1.0× zoom', async () => {
    const user = userEvent.setup()
    render(<SlideViewer slide={slide} />)

    fireEvent.load(screen.getByRole('img', { name: '低倍组织学切片示意图' }))

    const zoomOut = await screen.findByRole('button', { name: '缩小' })
    expect(zoomOut).toBeDisabled()

    const resetBtn = screen.getByRole('button', { name: '复位视图' })
    expect(resetBtn).toBeDisabled()

    const zoomIn = screen.getByRole('button', { name: '放大' })
    await user.click(zoomIn)
    expect(zoomOut).not.toBeDisabled()
    expect(resetBtn).not.toBeDisabled()
  })
})
