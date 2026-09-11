import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AIReport } from '../../components/ai/AIReport'
import {
  CaseInputForm,
  type CaseFormData,
} from '../../components/ai/CaseInputForm'
import { defaultContentBundle } from '../../data/content'
import { aiService } from '../../services/aiService'
import {
  useAIStore,
  type AIHistoryEntry,
} from '../../stores/aiStore'
import { downloadTextReport, printReportAsPdf } from '../../services/reportExport'
import type { AIAnalyzeRequest, AIResult } from '../../types/ai'
import type { AppError } from '../../types/error'
import styles from './AIDiagnosisPage.module.css'

type PageStatus = 'idle' | 'loading' | 'success' | 'error'

function parseInitialDraft(draft: string): CaseFormData {
  try {
    const parsed = JSON.parse(draft)
    if (parsed && typeof parsed === 'object') {
      return {
        age: String(parsed.age ?? ''),
        sex: String(parsed.sex ?? ''),
        smokingHistory: String(parsed.smokingHistory ?? ''),
        symptoms: String(parsed.symptoms ?? ''),
        lungFunction: String(parsed.lungFunction ?? ''),
        ctDescription: String(parsed.ctDescription ?? ''),
      }
    }
  } catch {
    // ignore
  }
  return {
    age: '',
    sex: '',
    smokingHistory: '',
    symptoms: '',
    lungFunction: '',
    ctDescription: '',
  }
}

export default function AIDiagnosisPage() {
  const draft = useAIStore((s) => s.draft)
  const lastResult = useAIStore((s) => s.lastResult)
  const setDraft = useAIStore((s) => s.setDraft)
  const setLastResult = useAIStore((s) => s.setLastResult)
  const returnPosition = useAIStore((s) => s.returnPosition)
  const history = useAIStore((s) => s.history)
  const addHistory = useAIStore((s) => s.addHistory)
  const loadHistoryEntry = useAIStore((s) => s.loadHistoryEntry)
  const clearHistory = useAIStore((s) => s.clearHistory)

  const initialForm = parseInitialDraft(draft)

  const [status, setStatus] = useState<PageStatus>(
    lastResult ? 'success' : 'idle',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentForm, setCurrentForm] = useState<CaseFormData>(initialForm)
  const [formVersion, setFormVersion] = useState('initial')

  const validAnchorIds = useMemo(
    () => new Set(defaultContentBundle.anchors.map((a) => a.id)),
    [],
  )

  const handleSubmit = useCallback(
    async (data: CaseFormData) => {
      setStatus('loading')
      setErrorMessage(null)

      // Persist draft immediately
      setDraft(JSON.stringify(data))
      setCurrentForm(data)

      const request: AIAnalyzeRequest = {
        patientInfo: {
          age: Number.parseInt(data.age, 10),
          sex: data.sex,
          smokingHistory: data.smokingHistory,
        },
        symptoms: data.symptoms
          .split(/[,;，；\n]/)
          .map((s) => s.trim())
          .filter(Boolean),
        tests: {
          ...(data.lungFunction ? { lungFunction: data.lungFunction } : {}),
          ...(data.ctDescription ? { ctDescription: data.ctDescription } : {}),
        },
        pathologyContext: [],
      }

      try {
        const result: AIResult = await aiService.analyze(request)
        setLastResult(result)
        addHistory({ form: data, result })
        setStatus('success')
      } catch (error) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as AppError).message)
            : error instanceof Error
              ? error.message
              : '分析请求失败，请重试。'
        setErrorMessage(message)
        setStatus('error')
      }
    },
    [addHistory, setDraft, setLastResult],
  )

  const handleRegenerate = useCallback(() => {
    if (currentForm.age && currentForm.sex) {
      void handleSubmit(currentForm)
    }
  }, [currentForm, handleSubmit])

  const handleLoadHistory = useCallback(
    (entry: AIHistoryEntry) => {
      loadHistoryEntry(entry)
      setCurrentForm(entry.form)
      setFormVersion(entry.id)
      setStatus('success')
      setErrorMessage(null)
    },
    [loadHistoryEntry],
  )

  const handleRetry = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  return (
    <section className={styles.page} aria-labelledby="ai-page-title">
      <p className={styles.eyebrow}>AI 练习</p>
      <h1 id="ai-page-title" tabIndex={-1} data-page-title="true">
        通过引导案例练习
      </h1>

      <div className={styles.layout}>
        <section className={styles.formCard} aria-labelledby="case-input-title">
          <h2 id="case-input-title" className={styles.cardTitle}>
            病例输入
          </h2>
          <div data-print-hide="true">
            <CaseInputForm
              key={formVersion}
            disabled={status === 'loading'}
              formKey={formVersion}
              initialData={initialForm}
              onSubmit={handleSubmit}
            />
            {history.length > 0 && (
              <section className={styles.history} aria-labelledby="history-title">
                <div className={styles.historyHeader}>
                  <h3 id="history-title" className={styles.historyTitle}>
                    病例历史记录
                  </h3>
                  <button
                    className={styles.historyClear}
                    onClick={clearHistory}
                    type="button"
                  >
                    清空
                  </button>
                </div>
                <ul className={styles.historyList}>
                  {history.map((entry) => (
                    <li key={entry.id} className={styles.historyItem}>
                      <button
                        className={styles.historyButton}
                        onClick={() => handleLoadHistory(entry)}
                        type="button"
                      >
                        <span>
                          {entry.form.age} 岁 · {entry.form.sex} ·{' '}
                          {entry.result.assessment.disease}
                        </span>
                        <time dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleString('zh-CN')}
                        </time>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </section>

        <section
          className={styles.resultCard}
          aria-labelledby="ai-result-title-wrapper"
        >
          <h2 id="ai-result-title-wrapper" className={styles.cardTitle}>
            分析结果
          </h2>

          {status === 'idle' && (
            <div className={styles.statusBox} role="status">
              请填写左侧病例信息后提交分析。
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.statusBox} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              正在调用 AI 分析服务，请稍候…
            </div>
          )}

          {status === 'error' && (
            <div className={styles.statusBox} role="alert">
              <p>{errorMessage ?? '分析失败。'}</p>
              <button
                className={styles.retryButton}
                onClick={handleRetry}
                type="button"
              >
                重新填写
              </button>
            </div>
          )}

          {status === 'success' && lastResult && (
            <>
              <div data-print-report="true">
                <AIReport result={lastResult} validAnchorIds={validAnchorIds} />
              </div>
              <div
                className={styles.reportActions}
                aria-label="报告操作"
                data-print-hide="true"
              >
                <button
                  className={styles.actionButton}
                  onClick={handleRegenerate}
                  type="button"
                >
                  重新生成分析
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => printReportAsPdf()}
                  type="button"
                >
                  导出 PDF
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => downloadTextReport(currentForm, lastResult)}
                  type="button"
                >
                  下载文本报告
                </button>
              </div>
              {returnPosition && (
                <Link
                  className={styles.evidenceLink}
                  to={`/explorer?anchor=${returnPosition}`}
                >
                  返回病理探索页查看证据
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  )
}
