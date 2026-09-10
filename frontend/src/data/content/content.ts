import { z } from 'zod'

import {
  anchorItemSchema,
  annotationDataSchema,
  clinicalDataSchema,
  homePageContentSchema,
  mechanismDataSchema,
  slideDataSchema,
  specimenDataSchema,
  hotspotDataSchema,
} from '../../types'

export const contentBundleSchema = z
  .object({
    home: homePageContentSchema,
    specimens: z.array(specimenDataSchema),
    hotspots: z.array(hotspotDataSchema),
    slides: z.array(slideDataSchema),
    annotations: z.array(annotationDataSchema),
    mechanisms: z.array(mechanismDataSchema),
    clinical: z.array(clinicalDataSchema),
    anchors: z.array(anchorItemSchema),
  })
  .strict()

export type ContentBundle = z.infer<typeof contentBundleSchema>

export type ContentValidationIssue = {
  code:
    | 'duplicate_id'
    | 'dangling_link'
    | 'missing_required'
    | 'invalid_coordinates'
    | 'missing_default_anchor'
  message: string
}

export type ContentValidationResult = {
  valid: boolean
  errors: string[]
}

const defaultImage = {
  src: '/content/placeholder.svg',
  source: 'local-placeholder',
  note: 'Placeholder asset to be replaced',
} as const

export const defaultContentBundle: ContentBundle = {
  home: {
    title: '基于证据的 COPD 病理学习',
    subtitle: '以标本、切片、标注、机制与临床串联起一条可追溯的学习路径。',
    learningPath: [
      {
        id: 'anchor_specimen',
        type: 'specimen',
        name: '标本概览',
        links: { slide: 'anchor_slide_1' },
      },
      {
        id: 'anchor_slide_1',
        type: 'slide',
        name: '切片概览',
        links: { annotation: 'anchor_annotation_1' },
      },
      {
        id: 'anchor_annotation_1',
        type: 'annotation',
        name: '标注解释',
        links: { mechanism: 'anchor_mechanism_1' },
      },
      {
        id: 'anchor_mechanism_1',
        type: 'mechanism',
        name: '机制总结',
        links: { clinical: 'anchor_clinical_1' },
      },
    ],
  },
  specimens: [
    {
      id: 'specimen_1',
      type: 'specimen',
      title: '支气管组织标本',
      image: defaultImage.src,
      altText: '支气管组织标本占位图',
      hotspots: ['hotspot_1', 'hotspot_2', 'hotspot_3'],
    },
  ],
  hotspots: [
    {
      id: 'hotspot_1',
      label: '气道狭窄',
      anchor: 'anchor_annotation_1',
      x: 0.2,
      y: 0.3,
      width: 0.2,
      height: 0.2,
    },
    {
      id: 'hotspot_2',
      label: '黏液堵塞',
      anchor: 'anchor_annotation_2',
      x: 0.45,
      y: 0.42,
      width: 0.2,
      height: 0.18,
    },
    {
      id: 'hotspot_3',
      label: '肺泡壁损失',
      anchor: 'anchor_annotation_3',
      x: 0.68,
      y: 0.25,
      width: 0.18,
      height: 0.2,
    },
  ],
  slides: [
    {
      id: 'slide_1',
      type: 'slide',
      title: '低倍组织学切片',
      image: defaultImage.src,
      altText: '低倍组织学切片占位图',
      anchor: 'anchor_slide_1',
    },
    {
      id: 'slide_2',
      type: 'slide',
      title: '高倍气道细节',
      image: defaultImage.src,
      altText: '高倍气道细节占位图',
      anchor: 'anchor_slide_2',
    },
    {
      id: 'slide_3',
      type: 'slide',
      title: '肺气肿模式概览',
      image: defaultImage.src,
      altText: '肺气肿模式概览占位图',
      anchor: 'anchor_slide_3',
    },
  ],
  annotations: [
    {
      id: 'annotation_1',
      type: 'annotation',
      name: '气道狭窄',
      description: '气道腔被炎症和黏液堵塞所缩窄。',
      anchor: 'anchor_annotation_1',
      slidePosition: { x: 0.15, y: 0.2, width: 0.25, height: 0.25 },
      links: {
        specimen: 'anchor_specimen',
        slide: 'anchor_slide_1',
        mechanism: 'anchor_mechanism_1',
        clinical: 'anchor_clinical_1',
      },
    },
    {
      id: 'annotation_2',
      type: 'annotation',
      name: '黏液堵塞',
      description: '黏液积聚和杯状细胞增生较为明显。',
      anchor: 'anchor_annotation_2',
      slidePosition: { x: 0.4, y: 0.35, width: 0.25, height: 0.2 },
      links: {
        specimen: 'anchor_specimen',
        slide: 'anchor_slide_2',
        mechanism: 'anchor_mechanism_2',
        clinical: 'anchor_clinical_2',
      },
    },
    {
      id: 'annotation_3',
      type: 'annotation',
      name: '肺泡壁损失',
      description: '肺泡隔膜被破坏，腔隙变得扩大。',
      anchor: 'anchor_annotation_3',
      slidePosition: { x: 0.55, y: 0.15, width: 0.25, height: 0.25 },
      links: {
        specimen: 'anchor_specimen',
        slide: 'anchor_slide_3',
        mechanism: 'anchor_mechanism_3',
        clinical: 'anchor_clinical_2',
      },
    },
  ],
  mechanisms: [
    {
      id: 'mechanism_1',
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
    },
    {
      id: 'mechanism_2',
      type: 'mechanism',
      title: '气流阻塞',
      anchor: 'anchor_mechanism_2',
      summary: '阻塞会减慢呼气流量并加重症状。',
      nodes: [
        {
          id: 'node_3',
          title: '阻塞',
          description: '堵塞会缩窄腔道并增加阻力。',
        },
      ],
    },
    {
      id: 'mechanism_3',
      type: 'mechanism',
      title: '实质破坏',
      anchor: 'anchor_mechanism_3',
      summary: '弹性组织损失会导致肺过度膨胀和呼吸困难。',
      nodes: [
        {
          id: 'node_4',
          title: '弹性回缩丧失',
          description: '气道失去支撑并在呼气时塌陷。',
        },
      ],
    },
  ],
  clinical: [
    {
      id: 'clinical_1',
      type: 'clinical',
      title: '慢性咳痰',
      anchor: 'anchor_clinical_1',
      summary: '症状常包括持续咳嗽和痰液产生。',
      impact: '疲劳和呼吸短促会影响日常活动。',
      symptoms: ['慢性咳嗽', '痰液增多', '气短'],
      treatment: ['支气管扩张剂治疗', '戒烟'],
      prevention: ['避免吸烟暴露', '坚持吸入器治疗'],
    },
    {
      id: 'clinical_2',
      type: 'clinical',
      title: '运动受限',
      anchor: 'anchor_clinical_2',
      summary: '患者常报告运动耐受下降和劳力性呼吸困难。',
      impact: '步行和爬楼会变得困难。',
      symptoms: ['劳力性呼吸困难', '耐力下降'],
      treatment: ['肺康复', '运动训练'],
      prevention: ['规律运动', '症状监测'],
    },
  ],
  anchors: [
    {
      id: 'anchor_specimen',
      type: 'specimen',
      name: '标本概览',
      links: { slide: 'anchor_slide_1' },
    },
    {
      id: 'anchor_slide_1',
      type: 'slide',
      name: '低倍概览',
      links: { annotation: 'anchor_annotation_1' },
    },
    {
      id: 'anchor_slide_2',
      type: 'slide',
      name: '气道细节',
      links: { annotation: 'anchor_annotation_2' },
    },
    {
      id: 'anchor_slide_3',
      type: 'slide',
      name: '实质细节',
      links: { annotation: 'anchor_annotation_3' },
    },
    {
      id: 'anchor_annotation_1',
      type: 'annotation',
      name: '气道狭窄',
      links: { mechanism: 'anchor_mechanism_1', clinical: 'anchor_clinical_1' },
    },
    {
      id: 'anchor_annotation_2',
      type: 'annotation',
      name: '黏液堵塞',
      links: { mechanism: 'anchor_mechanism_2', clinical: 'anchor_clinical_2' },
    },
    {
      id: 'anchor_annotation_3',
      type: 'annotation',
      name: '肺泡壁损失',
      links: { mechanism: 'anchor_mechanism_3' },
    },
    {
      id: 'anchor_mechanism_1',
      type: 'mechanism',
      name: '慢性炎症',
      links: { clinical: 'anchor_clinical_1' },
    },
    {
      id: 'anchor_mechanism_2',
      type: 'mechanism',
      name: '气流阻塞',
      links: { clinical: 'anchor_clinical_2' },
    },
    {
      id: 'anchor_mechanism_3',
      type: 'mechanism',
      name: '实质破坏',
      links: { clinical: 'anchor_clinical_2' },
    },
    { id: 'anchor_clinical_1', type: 'clinical', name: '慢性咳痰' },
    { id: 'anchor_clinical_2', type: 'clinical', name: '运动受限' },
  ],
}

export function validateContentBundle(
  bundle: ContentBundle,
): ContentValidationResult {
  const errors: string[] = []
  const recordById = new Map<string, string>()

  const addId = (id: string, kind: string) => {
    if (recordById.has(id)) {
      errors.push(`duplicate_id:${kind}:${id}`)
      return
    }
    recordById.set(id, kind)
  }

  for (const specimen of bundle.specimens) {
    addId(specimen.id, 'specimen')
  }
  for (const hotspot of bundle.hotspots) {
    addId(hotspot.id, 'hotspot')
  }
  for (const slide of bundle.slides) {
    addId(slide.id, 'slide')
  }
  for (const annotation of bundle.annotations) {
    addId(annotation.id, 'annotation')
  }
  for (const mechanism of bundle.mechanisms) {
    addId(mechanism.id, 'mechanism')
  }
  for (const item of bundle.clinical) {
    addId(item.id, 'clinical')
  }
  for (const anchor of bundle.anchors) {
    addId(anchor.id, 'anchor')
  }

  const allAnchorIds = new Set(bundle.anchors.map((anchor) => anchor.id))

  for (const hotspot of bundle.hotspots) {
    if (
      hotspot.x < 0 ||
      hotspot.y < 0 ||
      hotspot.width < 0 ||
      hotspot.height < 0 ||
      hotspot.x + hotspot.width > 1 ||
      hotspot.y + hotspot.height > 1
    ) {
      errors.push(`invalid_coordinates:${hotspot.id}`)
    }
    if (!allAnchorIds.has(hotspot.anchor)) {
      errors.push(`dangling_link:${hotspot.anchor}`)
    }
  }

  for (const slide of bundle.slides) {
    if (!allAnchorIds.has(slide.anchor)) {
      errors.push(`dangling_link:${slide.anchor}`)
    }
  }

  for (const annotation of bundle.annotations) {
    for (const targetAnchor of Object.values(annotation.links)) {
      if (targetAnchor && !allAnchorIds.has(targetAnchor)) {
        errors.push(`dangling_link:${targetAnchor}`)
      }
    }
    if (!allAnchorIds.has(annotation.anchor)) {
      errors.push(`dangling_link:${annotation.anchor}`)
    }
    if (annotation.slidePosition) {
      const pos = annotation.slidePosition
      if (
        pos.x < 0 ||
        pos.y < 0 ||
        pos.width < 0 ||
        pos.height < 0 ||
        pos.x + pos.width > 1 ||
        pos.y + pos.height > 1
      ) {
        errors.push(`invalid_coordinates:${annotation.id}`)
      }
    }
  }

  for (const mechanism of bundle.mechanisms) {
    if (!allAnchorIds.has(mechanism.anchor)) {
      errors.push(`dangling_link:${mechanism.anchor}`)
    }
  }

  for (const item of bundle.clinical) {
    if (!allAnchorIds.has(item.anchor)) {
      errors.push(`dangling_link:${item.anchor}`)
    }
  }

  for (const anchor of bundle.anchors) {
    for (const targetAnchor of Object.values(anchor.links ?? {}) as string[]) {
      if (targetAnchor && !allAnchorIds.has(targetAnchor)) {
        errors.push(`dangling_link:${targetAnchor}`)
      }
    }
  }

  if (bundle.home.learningPath.length < 1) {
    errors.push('missing_required:home.learningPath')
  }

  if (bundle.specimens.length < 1) {
    errors.push('missing_required:specimens')
  }

  if (bundle.hotspots.length < 3) {
    errors.push('missing_required:hotspots')
  }

  if (bundle.slides.length < 3) {
    errors.push('missing_required:slides')
  }

  if (bundle.annotations.length < 3) {
    errors.push('missing_required:annotations')
  }

  if (bundle.mechanisms.length < 2) {
    errors.push('missing_required:mechanisms')
  }

  if (bundle.clinical.length < 2) {
    errors.push('missing_required:clinical')
  }

  if (!bundle.anchors.some((anchor) => anchor.type === 'specimen')) {
    errors.push('missing_default_anchor:specimen')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function parseContentBundle(input: unknown): ContentBundle {
  return contentBundleSchema.parse(input)
}
