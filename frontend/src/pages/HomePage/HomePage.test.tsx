import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders the hero, learning path, and CTA', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: '基于证据的 COPD 病理学习' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '开始探索' })).toHaveAttribute(
      'href',
      '/explorer',
    )
    expect(
      screen.getByRole('heading', { name: '四步引导式学习流' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '医学提示' }),
    ).toBeInTheDocument()
  })
})
