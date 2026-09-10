import { describe, expect, it } from 'vitest'

import { MockAIService, RemoteAIService, type AIService } from '../aiService'
import type { AIAnalyzeRequest } from '../../types/ai'
import { aiResultSchema } from '../../types/ai'

const validRequest: AIAnalyzeRequest = {
  patientInfo: {
    age: 65,
    sex: '男性',
    smokingHistory: '40 年，每日一包',
  },
  symptoms: ['慢性咳嗽', '咳痰', '活动后气促'],
  tests: {
    lungFunction: 'FEV₁/FVC 0.62，吸入支气管扩张剂后改善 < 12%',
    ctDescription: '双肺透亮度增高，可见多发肺大疱',
  },
  pathologyContext: ['气道狭窄', '黏液堵塞', '肺泡壁损失'],
}

describe('MockAIService', () => {
  const service: AIService = new MockAIService()

  it('returns a valid AIResult with required fields', async () => {
    const result = await service.analyze(validRequest)

    expect(() => aiResultSchema.parse(result)).not.toThrow()
    expect(result.assessment.disease).toBeTruthy()
    expect(result.assessment.likelihood).toBe('high')
    expect(result.evidence.length).toBeGreaterThanOrEqual(1)
    expect(result.differential.length).toBeGreaterThanOrEqual(1)
    expect(result.recommendation.length).toBeGreaterThanOrEqual(1)
    expect(result.disclaimer).toBeTruthy()
  })

  it('references only real annotation anchors in evidence', async () => {
    const realAnchors = [
      'anchor_annotation_1',
      'anchor_annotation_2',
      'anchor_annotation_3',
    ]

    const result = await service.analyze(validRequest)

    for (const evidence of result.evidence) {
      expect(realAnchors).toContain(evidence.anchorId)
    }
  })

  it('supports cancellation via AbortSignal', async () => {
    const controller = new AbortController()

    const promise = service.analyze(validRequest, controller.signal)
    controller.abort()

    await expect(promise).rejects.toThrow('操作已取消')
  })

  it('rejects when signal is already aborted before call', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      service.analyze(validRequest, controller.signal),
    ).rejects.toThrow('操作已取消')
  })
})

describe('AIService interface compliance', () => {
  it('Mock and Remote expose the same analyze signature', () => {
    const mock = new MockAIService()
    const remote = new RemoteAIService()

    expect(typeof mock.analyze).toBe('function')
    expect(typeof remote.analyze).toBe('function')
    expect(mock.analyze.length).toBe(remote.analyze.length)
  })
})

describe('AI result schema validation', () => {
  it('rejects a response missing the disclaimer field', () => {
    const invalid = {
      assessment: {
        disease: 'COPD',
        likelihood: 'high',
        confidence: 0.8,
        basis: ['Cough'],
      },
      evidence: [{ text: 'Airway narrowing', anchorId: 'anchor_annotation_1' }],
      differential: [],
      recommendation: [],
      // disclaimer intentionally omitted
    }

    expect(() => aiResultSchema.parse(invalid)).toThrow()
  })

  it('rejects an evidence item with an invalid anchorId', () => {
    const invalid = {
      assessment: {
        disease: 'COPD',
        likelihood: 'medium',
        confidence: 0.6,
        basis: ['Dyspnea'],
      },
      evidence: [{ text: 'sample', anchorId: 'not_an_anchor!' }],
      differential: ['Asthma'],
      recommendation: ['Rest'],
      disclaimer: 'Educational',
    }

    expect(() => aiResultSchema.parse(invalid)).toThrow()
  })

  it('rejects when evidence array is empty', () => {
    const invalid = {
      assessment: {
        disease: 'COPD',
        likelihood: 'low',
        confidence: 0.3,
        basis: ['Wheezing'],
      },
      evidence: [],
      differential: ['Asthma'],
      recommendation: ['Inhaler'],
      disclaimer: 'Educational',
    }

    expect(() => aiResultSchema.parse(invalid)).toThrow()
  })
})

describe('MockAIService timeout simulation', () => {
  it('demonstrates that a long-running analysis can be aborted mid-flight', async () => {
    const controller = new AbortController()
    const service = new MockAIService()

    const promise = service.analyze(validRequest, controller.signal)

    // Abort after 100ms (well before the mock 800-1500ms delay)
    await new Promise((r) => setTimeout(r, 100))
    controller.abort()

    await expect(promise).rejects.toThrow('操作已取消')
  })
})
