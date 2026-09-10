import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CaseInputForm } from './CaseInputForm'

describe('CaseInputForm', () => {
  it('renders all required fields and privacy notice', () => {
    render(<CaseInputForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText(/65/)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/40 年/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/慢性咳嗽/)).toBeInTheDocument()
    expect(
      screen.getByText(/请勿输入可识别真实患者身份的信息/),
    ).toBeInTheDocument()
  })

  it('submit is disabled until required fields are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<CaseInputForm onSubmit={onSubmit} />)

    const submit = screen.getByRole('button', { name: '提交分析' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText(/65/), '70')
    await user.selectOptions(screen.getByRole('combobox'), '男性')
    await user.type(screen.getByPlaceholderText(/40 年/), '30 年')
    await user.type(screen.getByPlaceholderText(/慢性咳嗽/), '气促、咳痰')

    expect(submit).not.toBeDisabled()
  })

  it('calls onSubmit with trimmed form data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<CaseInputForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/65/), '55')
    await user.selectOptions(screen.getByRole('combobox'), '女性')
    await user.type(screen.getByPlaceholderText(/40 年/), '无吸烟史')
    await user.type(screen.getByPlaceholderText(/慢性咳嗽/), '呼吸困难')
    await user.click(screen.getByRole('button', { name: '提交分析' }))

    expect(onSubmit).toHaveBeenCalledWith({
      age: '55',
      sex: '女性',
      smokingHistory: '无吸烟史',
      symptoms: '呼吸困难',
      lungFunction: '',
      ctDescription: '',
    })
  })

  it('shows disabled state when disabled prop is true', () => {
    render(<CaseInputForm disabled onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: /分析中/i })).toBeDisabled()
    expect(screen.getByPlaceholderText(/65/)).toBeDisabled()
  })

  it('prevents submit when only partial fields are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<CaseInputForm onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/65/), '50')
    // Missing sex, smoking, symptoms
    await user.click(screen.getByRole('button', { name: '提交分析' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
