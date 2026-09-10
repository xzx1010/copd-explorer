import { describe, expect, it, beforeEach } from 'vitest'

import type { AIResult } from '../types/ai'
import { useAIStore } from './aiStore'

const sampleResult: AIResult = {
  assessment: {
    disease: 'COPD',
    likelihood: 'high',
    confidence: 0.85,
    basis: ['Chronic cough', 'Airflow limitation'],
  },
  evidence: [
    { text: 'Airway narrowing observed', anchorId: 'anchor_annotation_1' },
  ],
  differential: ['Asthma', 'Bronchitis'],
  recommendation: ['Pulmonary function test', 'Smoking cessation'],
  disclaimer: 'This is an educational tool, not clinical advice.',
}

describe('AI Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAIStore.getState().clearAll()
    sessionStorage.clear()
  })

  it('starts with empty defaults', () => {
    const { draft, lastResult, returnPosition } = useAIStore.getState()
    expect(draft).toBe('')
    expect(lastResult).toBeNull()
    expect(returnPosition).toBeNull()
  })

  it('persists draft changes', () => {
    useAIStore.getState().setDraft('Patient case notes...')
    expect(useAIStore.getState().draft).toBe('Patient case notes...')
  })

  it('persists and retrieves a result', () => {
    useAIStore.getState().setLastResult(sampleResult)
    expect(useAIStore.getState().lastResult).toEqual(sampleResult)
  })

  it('stores return position for cross-page navigation', () => {
    useAIStore.getState().setReturnPosition('anchor_annotation_1')
    expect(useAIStore.getState().returnPosition).toBe('anchor_annotation_1')
  })

  it('clearAll resets everything', () => {
    useAIStore.getState().setDraft('notes')
    useAIStore.getState().setLastResult(sampleResult)
    useAIStore.getState().setReturnPosition('anchor_annotation_1')

    useAIStore.getState().clearAll()

    const { draft, lastResult, returnPosition } = useAIStore.getState()
    expect(draft).toBe('')
    expect(lastResult).toBeNull()
    expect(returnPosition).toBeNull()
  })
})
