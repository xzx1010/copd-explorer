import { describe, expect, it } from 'vitest'

import {
  aiAnalyzeRequestSchema,
  aiResultSchema,
  anchorItemSchema,
  annotationDataSchema,
  appErrorSchema,
  clinicalDataSchema,
  explorerContextSchema,
  homePageContentSchema,
  mechanismDataSchema,
  slideDataSchema,
  specimenDataSchema,
} from '../index'

describe('frontend domain contracts', () => {
  it('accepts a valid anchor graph and content payload', () => {
    const anchor = anchorItemSchema.parse({
      id: 'bronchus_1',
      type: 'specimen',
      name: 'Bronchial specimen',
      links: { slide: 'slide_1' },
    })

    const specimen = specimenDataSchema.parse({
      id: 'specimen_1',
      type: 'specimen',
      title: 'Bronchial tissue sample',
      image: '/images/specimen.png',
      altText: 'A tissue specimen',
      hotspots: ['hotspot_1'],
    })

    const slide = slideDataSchema.parse({
      id: 'slide_1',
      type: 'slide',
      title: 'Histology slide',
      image: '/images/slide.png',
      altText: 'A histology slide',
      anchor: 'bronchus_1',
    })

    const annotation = annotationDataSchema.parse({
      id: 'annotation_1',
      type: 'annotation',
      name: 'Goblet cell hyperplasia',
      description: 'Multifocal goblet cell expansion with mucus plugging',
      anchor: 'bronchus_1',
      links: { specimen: 'specimen_1', slide: 'slide_1' },
    })

    const mechanism = mechanismDataSchema.parse({
      id: 'mechanism_1',
      type: 'mechanism',
      title: 'Airflow limitation',
      anchor: 'bronchus_1',
      summary: 'Long-term irritation causes airway narrowing',
      nodes: [
        {
          id: 'n1',
          title: 'Inflammation',
          description: 'Mucus and edema narrow the lumen',
        },
      ],
    })

    const clinical = clinicalDataSchema.parse({
      id: 'clinical_1',
      type: 'clinical',
      title: 'Clinical presentation',
      anchor: 'bronchus_1',
      summary: 'Progressive breathlessness and cough',
      impact: 'Daily activities are affected',
      symptoms: ['Cough', 'Dyspnea'],
      treatment: ['Bronchodilator'],
      prevention: ['Smoking cessation'],
    })

    const context = explorerContextSchema.parse({
      anchor: 'bronchus_1',
      specimen,
      slide,
      annotation,
      mechanism,
      clinical,
    })

    expect(context.anchor).toBe(anchor.id)
  })

  it('validates ai request and result payloads', () => {
    const request = aiAnalyzeRequestSchema.parse({
      patientInfo: {
        age: 67,
        sex: 'male',
        smokingHistory: '40 pack-years',
      },
      symptoms: ['Dyspnea', 'Chronic cough'],
      tests: {
        lungFunction: 'FEV1/FVC 0.61',
        ctDescription: 'Hyperinflation and emphysema',
      },
      pathologyContext: ['Mucus plugging', 'Airway narrowing'],
    })

    const result = aiResultSchema.parse({
      assessment: {
        disease: 'COPD',
        likelihood: 'high',
        confidence: 0.89,
        basis: ['Emphysema pattern', 'Smoking history'],
      },
      evidence: [{ text: 'Airway narrowing observed', anchorId: 'bronchus_1' }],
      differential: ['Asthma', 'Bronchiectasis'],
      recommendation: ['Consider spirometry review'],
      disclaimer: 'This is educational content, not medical diagnosis',
    })

    expect(request.patientInfo.age).toBe(67)
    expect(result.assessment.likelihood).toBe('high')
  })

  it('rejects malformed data', () => {
    expect(() =>
      anchorItemSchema.parse({ id: 'Invalid', type: 'specimen', name: ' ' }),
    ).toThrow()
    expect(() =>
      appErrorSchema.parse({ code: 'UNKNOWN', message: '', status: 500 }),
    ).toThrow()
    expect(() =>
      homePageContentSchema.parse({
        title: 'COPD',
        subtitle: 'Education',
        learningPath: [{ id: 'invalid', type: 'unknown', name: 'Bad' }],
      }),
    ).toThrow()
  })
})
