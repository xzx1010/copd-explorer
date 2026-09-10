import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LoadingScreen } from './LoadingScreen'

describe('LoadingScreen', () => {
  it('announces page loading', () => {
    render(<LoadingScreen />)

    expect(screen.getByRole('status')).toHaveTextContent('正在加载页面…')
  })
})
