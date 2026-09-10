import type { AIAnalyzeRequest, AIResult } from '../types/ai'
import { useMockApi } from './config'

/**
 * Shared contract for AI analysis.
 *
 * Both mock and remote implementations must satisfy this interface so
 * page components never need to know which backend is active.
 */
export interface AIService {
  analyze(request: AIAnalyzeRequest, signal?: AbortSignal): Promise<AIResult>
}

// ---------------------------------------------------------------------------
// Mock implementation – deterministic fixtures referencing real anchors
// ---------------------------------------------------------------------------

const mockResult: AIResult = {
  assessment: {
    disease: '慢性阻塞性肺疾病（COPD）',
    likelihood: 'high',
    confidence: 0.88,
    basis: [
      '长期吸烟史与慢性咳嗽、咳痰表现高度吻合',
      '肺功能检查提示不可逆性气流受限',
      '病理切片可见气道狭窄、黏液腺体增生及肺泡壁破坏',
    ],
  },
  evidence: [
    {
      text: '宏观标本热区可见支气管管壁增厚、管腔狭窄',
      anchorId: 'anchor_annotation_1',
    },
    {
      text: '镜下可见杯状细胞增生、黏液栓形成',
      anchorId: 'anchor_annotation_2',
    },
    {
      text: '肺泡隔膜断裂、肺泡腔扩大融合呈肺气肿改变',
      anchorId: 'anchor_annotation_3',
    },
  ],
  differential: [
    '支气管哮喘（可逆性气流受限，缓解期肺功能可恢复正常）',
    '支气管扩张症（大量脓痰，HRCT 可见支气管扩张）',
    '慢性心力衰竭（BNP 升高，心脏超声可鉴别）',
  ],
  recommendation: [
    '长期家庭氧疗（静息 SpO₂ ≤ 88% 时）',
    '吸入长效支气管扩张剂联合 ICS 治疗',
    '肺康复训练（包括呼吸肌训练和耐力训练）',
    '定期接种流感疫苗和肺炎球菌疫苗',
  ],
  disclaimer:
    '本分析仅为教学用途，不构成临床诊断建议。任何实际诊疗决策均需由具备执业资质的医师在全面评估后作出。',
}

export class MockAIService implements AIService {
  async analyze(
    _request: AIAnalyzeRequest,
    signal?: AbortSignal,
  ): Promise<AIResult> {
    // Simulate realistic network latency (800–1500 ms)
    const delay = 800 + Math.random() * 700

    return new Promise<AIResult>((resolve, reject) => {
      const timer = window.setTimeout(() => resolve(mockResult), delay)

      if (signal) {
        if (signal.aborted) {
          window.clearTimeout(timer)
          reject(new DOMException('操作已取消。', 'AbortError'))
          return
        }

        signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer)
            reject(new DOMException('操作已取消。', 'AbortError'))
          },
          { once: true },
        )
      }
    })
  }
}

// ---------------------------------------------------------------------------
// Remote implementation – delegates to POST /api/ai/analyze
// ---------------------------------------------------------------------------

import { apiClient } from './apiClient'
import { aiResultSchema } from '../types/ai'
import type { AppError } from '../types/error'

export class RemoteAIService implements AIService {
  async analyze(
    request: AIAnalyzeRequest,
    signal?: AbortSignal,
  ): Promise<AIResult> {
    const raw = await apiClient.post<unknown>('/ai/analyze', request, {
      ...(signal ? { signal } : {}),
      timeoutMs: 20_000,
    })

    const parsed = aiResultSchema.safeParse(raw)
    if (!parsed.success) {
      const error: AppError = {
        code: 'VALIDATION_ERROR',
        message: 'AI 响应格式不合法，无法解析。',
        status: 502,
        details: { zod: parsed.error.message },
      }
      throw error
    }

    return parsed.data
  }
}

// ---------------------------------------------------------------------------
// Factory – switchable via VITE_USE_MOCK_API
// ---------------------------------------------------------------------------

function createAIService(): AIService {
  return useMockApi ? new MockAIService() : new RemoteAIService()
}

/** Singleton AI service instance used across the app. */
export const aiService: AIService = createAIService()
