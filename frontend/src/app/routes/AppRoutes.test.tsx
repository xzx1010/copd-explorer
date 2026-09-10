import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from './AppRoutes'

async function renderRoute(route: string) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>,
  )

  await screen.findByRole('main')
}

describe('application routes', () => {
  it.each([
    ['/', '基于证据的 COPD 病理学习'],
    ['/explorer', '探索病理上下文'],
    ['/mechanism', '跟随疾病机制'],
    ['/ai', '通过引导案例练习'],
  ])('renders %s', async (route, title) => {
    await renderRoute(route)

    expect(
      await screen.findByRole('heading', { name: title }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute('data-page-title', 'true'),
    )
  })

  it('renders a friendly not found page and can return home', async () => {
    const user = userEvent.setup()
    await renderRoute('/not-a-real-page')

    expect(
      await screen.findByRole('heading', { name: '页面不存在' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '返回首页' }))

    expect(
      await screen.findByRole('heading', {
        name: '基于证据的 COPD 病理学习',
      }),
    ).toBeInTheDocument()
  })

  it('switches routes through the primary navigation', async () => {
    const user = userEvent.setup()
    await renderRoute('/')

    await user.click(screen.getByRole('link', { name: '探索' }))

    expect(
      await screen.findByRole('heading', { name: '探索病理上下文' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '探索' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
