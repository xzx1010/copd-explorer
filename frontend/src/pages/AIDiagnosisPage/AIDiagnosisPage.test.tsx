import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'

import AIDiagnosisPage from './AIDiagnosisPage'
import { useAIStore } from '../../stores/aiStore'
import type { AIResult } from '../../types/ai'

const sampleResult: AIResult = {
  assessment: {
    disease: '慢性阻塞性肺疾病（COPD）',
    likelihood: 'high',
    confidence: 0.88,
    basis: ['长期吸烟史'],
  },
  evidence: [{ text: '支气管管壁增厚', anchorId: 'anchor_annotation_1' }],
  differential: ['支气管哮喘'],
  recommendation: ['家庭氧疗'],
  disclaimer: '本分析仅为教学用途。',
}

describe('AIDiagnosisPage', () => {
  beforeEach(() => {
    useAIStore.getState().clearAll()
    sessionStorage.clear()
  })

  it('renders the form and idle state for the result area', async () => {
    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /通过引导案例练习/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /病例输入/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /分析结果/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/请填写左侧病例信息/i)).toBeInTheDocument()
  })

  it('prevents submit when required fields are empty', async () => {
    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    const submit = await screen.findByRole('button', { name: '提交分析' })
    expect(submit).toBeDisabled()
  })

  it('enables submit when required fields are filled', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/65/), '65')
    await user.selectOptions(screen.getByRole('combobox'), '男性')
    await user.type(screen.getByPlaceholderText(/40 年/), '40 年，每日一包')
    await user.type(screen.getByPlaceholderText(/慢性咳嗽/), '慢性咳嗽，咳痰')

    const submit = screen.getByRole('button', { name: '提交分析' })
    expect(submit).not.toBeDisabled()
  })

  it('shows the privacy notice', async () => {
    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/请勿输入可识别真实患者身份的信息/),
    ).toBeInTheDocument()
  })

  it('restores a previous result from the store and renders the report', async () => {
    // Pre-populate the store with a result
    useAIStore.getState().setLastResult(sampleResult)

    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    // Should immediately show the report (not idle state)
    await waitFor(() => {
      expect(screen.getByText(/AI 分析报告/i)).toBeInTheDocument()
    })

    // Section headings should be visible
    expect(
      screen.getByRole('heading', { name: /疾病评估/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /病理证据/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /鉴别诊断/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /建议/i })).toBeInTheDocument()
    expect(screen.getByText(/本分析仅为教学用途。/i)).toBeInTheDocument()

    // Evidence link should be rendered
    const evidenceLink = screen.getByRole('link', { name: /查看病理证据/ })
    expect(evidenceLink).toBeInTheDocument()
    const href = evidenceLink.getAttribute('href') ?? ''
    expect(href).toContain('/explorer?anchor=anchor_annotation_')
    expect(href).toContain('from=ai')
  })

  it('completes a mock analysis flow and renders the report', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AIDiagnosisPage />
      </MemoryRouter>,
    )

    // Fill required fields
    await user.type(screen.getByPlaceholderText(/65/), '65')
    await user.selectOptions(screen.getByRole('combobox'), '男性')
    await user.type(screen.getByPlaceholderText(/40 年/), '40 年，每日一包')
    await user.type(screen.getByPlaceholderText(/慢性咳嗽/), '慢性咳嗽，咳痰')

    // Submit
    await user.click(screen.getByRole('button', { name: '提交分析' }))

    // Button should change to disabled "分析中…"
    expect(screen.getByRole('button', { name: /分析中/i })).toBeDisabled()

    // Wait for the mock result to appear
    await waitFor(
      () => {
        expect(screen.getByText(/AI 分析报告/i)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    // Verify key sections are rendered
    expect(screen.getByText(/慢性阻塞性肺疾病/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /病理证据/i }),
    ).toBeInTheDocument()

    // Evidence links should be present
    const evidenceLinks = screen.getAllByRole('link', { name: /查看病理证据/i })
    expect(evidenceLinks.length).toBeGreaterThanOrEqual(1)
    const firstHref = evidenceLinks[0]!.getAttribute('href') ?? ''
    expect(firstHref).toMatch(/\/explorer\?anchor=anchor_annotation/)
    expect(firstHref).toContain('from=ai')
  })
})
