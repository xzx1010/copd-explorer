import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ExplorerPage from './ExplorerPage'

describe('ExplorerPage', () => {
  it('渲染包含标本、切片和病理解释的 Explorer 页面骨架', async () => {
    render(
      <MemoryRouter>
        <ExplorerPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /探索病理上下文/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /标本区域/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /切片区域/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /病理解释/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /机制通路/i }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: /临床表现/i }),
    ).toBeInTheDocument()
  })

  it('点击热区后会切换到对应的病理上下文', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer?anchor=anchor_specimen']}>
        <ExplorerPage />
      </MemoryRouter>,
    )

    fireEvent.load(await screen.findByRole('img', { name: /支气管组织标本/i }))
    await user.click(screen.getByRole('button', { name: /气道狭窄/i }))

    expect(
      await screen.findByText(/细胞损伤会推动气道狭窄和黏液过度产生。/i),
    ).toBeInTheDocument()
  })

  it('点击切片标注区域后会切换到对应注解锚点', async () => {
    render(
      <MemoryRouter initialEntries={['/explorer?anchor=anchor_annotation_1']}>
        <ExplorerPage />
      </MemoryRouter>,
    )

    // We already have annotation_1 selected; the slide should show its marker
    const marker = await screen.findByRole('button', {
      name: /气道狭窄（已选中）/i,
    })
    expect(marker).toBeInTheDocument()
    expect(marker).toHaveAttribute('aria-pressed', 'true')
  })

  it('显示无效锚点恢复提示并支持回到默认入口', async () => {
    render(
      <MemoryRouter initialEntries={['/explorer?anchor=bad!format']}>
        <ExplorerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/不是有效的锚点格式/i)).toBeInTheDocument()
    // ErrorState renders a retry button
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument()
  })

  it('锚点格式正确但不存在时显示空状态', async () => {
    render(
      <MemoryRouter initialEntries={['/explorer?anchor=anchor_nope_99']}>
        <ExplorerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/暂无可显示内容/i)).toBeInTheDocument()
  })

  it('显示来自 AI 分析的返回入口', async () => {
    render(
      <MemoryRouter
        initialEntries={['/explorer?anchor=anchor_annotation_1&from=ai']}
      >
        <ExplorerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/来自 AI 分析/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回 AI 分析' })).toHaveAttribute(
      'href',
      '/ai',
    )
  })
})
