import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { MechanismData } from '../../types/content'
import { MechanismFlow } from './MechanismFlow'

const mechanism: MechanismData = {
  id: 'mechanism_test',
  type: 'mechanism',
  title: '慢性炎症',
  anchor: 'anchor_mechanism_1',
  summary: '细胞损伤会推动气道狭窄和黏液过度产生。',
  nodes: [
    {
      id: 'node_1',
      title: '炎症',
      description: '反复刺激会增加免疫细胞活性。',
    },
    {
      id: 'node_2',
      title: '黏液',
      description: '杯状细胞化生会产生过多黏液。',
    },
  ],
}

describe('MechanismFlow', () => {
  it('shows empty state when mechanism is null', () => {
    render(<MechanismFlow mechanism={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('暂无机制数据')
  })

  it('renders mechanism title and summary', () => {
    render(<MechanismFlow mechanism={mechanism} />)

    expect(screen.getByText('慢性炎症')).toBeInTheDocument()
    expect(
      screen.getByText('细胞损伤会推动气道狭窄和黏液过度产生。'),
    ).toBeInTheDocument()
  })

  it('renders all node triggers in collapsed state', () => {
    render(<MechanismFlow mechanism={mechanism} />)

    expect(
      screen.getByRole('button', { name: '炎症：展开说明' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '黏液：展开说明' }),
    ).toBeInTheDocument()

    // Descriptions should not be visible when collapsed
    expect(
      screen.queryByText('反复刺激会增加免疫细胞活性。'),
    ).not.toBeInTheDocument()
  })

  it('expands and collapses a node on click', async () => {
    const user = userEvent.setup()
    render(<MechanismFlow mechanism={mechanism} />)

    const trigger = screen.getByRole('button', { name: '炎症：展开说明' })
    await user.click(trigger)

    expect(
      screen.getByRole('button', { name: '炎症：收起说明' }),
    ).toBeInTheDocument()
    expect(screen.getByText('反复刺激会增加免疫细胞活性。')).toBeInTheDocument()

    await user.click(trigger)
    expect(
      screen.getByRole('button', { name: '炎症：展开说明' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('反复刺激会增加免疫细胞活性。'),
    ).not.toBeInTheDocument()
  })

  it('supports keyboard activation with Enter and Space', async () => {
    const user = userEvent.setup()
    render(<MechanismFlow mechanism={mechanism} />)

    const trigger = screen.getByRole('button', { name: '黏液：展开说明' })
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(
      screen.getByRole('button', { name: '黏液：收起说明' }),
    ).toBeInTheDocument()
    expect(screen.getByText('杯状细胞化生会产生过多黏液。')).toBeInTheDocument()
  })

  it('toggles different nodes independently', async () => {
    const user = userEvent.setup()
    render(<MechanismFlow mechanism={mechanism} />)

    await user.click(screen.getByRole('button', { name: '炎症：展开说明' }))
    expect(screen.getByText('反复刺激会增加免疫细胞活性。')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '黏液：展开说明' }))
    expect(screen.getByText('杯状细胞化生会产生过多黏液。')).toBeInTheDocument()

    // First one should still be expanded
    expect(
      screen.getByRole('button', { name: '炎症：收起说明' }),
    ).toBeInTheDocument()
  })
})
