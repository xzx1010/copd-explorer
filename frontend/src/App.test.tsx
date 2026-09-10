import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the home route through the application shell', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', {
        name: '基于证据的 COPD 病理学习',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
