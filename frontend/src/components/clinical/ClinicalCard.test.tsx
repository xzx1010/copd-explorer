import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ClinicalData } from '../../types/content'
import { ClinicalCard } from './ClinicalCard'

const clinical: ClinicalData = {
  id: 'clinical_test',
  type: 'clinical',
  title: '慢性咳痰',
  anchor: 'anchor_clinical_1',
  summary: '症状常包括持续咳嗽和痰液产生。',
  impact: '疲劳和呼吸短促会影响日常活动。',
  symptoms: ['慢性咳嗽', '痰液增多', '气短'],
  treatment: ['支气管扩张剂治疗', '戒烟'],
  prevention: ['避免吸烟暴露', '坚持吸入器治疗'],
}

describe('ClinicalCard', () => {
  it('shows empty state when clinical data is null', () => {
    render(<ClinicalCard clinical={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('暂无临床数据')
  })

  it('renders title and summary', () => {
    render(<ClinicalCard clinical={clinical} />)

    expect(screen.getByText('慢性咳痰')).toBeInTheDocument()
    expect(
      screen.getByText('症状常包括持续咳嗽和痰液产生。'),
    ).toBeInTheDocument()
  })

  it('renders all four clinical sections', () => {
    render(<ClinicalCard clinical={clinical} />)

    expect(
      screen.getByRole('heading', { name: '功能影响' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '临床表现' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '治疗启示' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '预防建议' }),
    ).toBeInTheDocument()
  })

  it('renders symptom, treatment and prevention tags', () => {
    render(<ClinicalCard clinical={clinical} />)

    // Symptoms
    expect(screen.getByText('慢性咳嗽')).toBeInTheDocument()
    expect(screen.getByText('痰液增多')).toBeInTheDocument()
    expect(screen.getByText('气短')).toBeInTheDocument()

    // Treatment
    expect(screen.getByText('支气管扩张剂治疗')).toBeInTheDocument()
    expect(screen.getByText('戒烟')).toBeInTheDocument()

    // Prevention
    expect(screen.getByText('避免吸烟暴露')).toBeInTheDocument()
    expect(screen.getByText('坚持吸入器治疗')).toBeInTheDocument()
  })

  it('renders functional impact text', () => {
    render(<ClinicalCard clinical={clinical} />)
    expect(
      screen.getByText('疲劳和呼吸短促会影响日常活动。'),
    ).toBeInTheDocument()
  })
})
