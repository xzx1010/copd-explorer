import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { MechanismFlow } from '../../components/mechanism/MechanismFlow'
import { useAnchorNavigation } from '../../hooks/useAnchorNavigation'
import { contentRepository } from '../../services/content'
import type { ExplorerContext } from '../../types/content'
import styles from './MechanismPage.module.css'

const DEFAULT_ANCHOR = 'anchor_mechanism_1'

type PageState = {
  status: 'loading' | 'ready' | 'empty' | 'error'
  context: ExplorerContext | null
  errorMessage: string | null
}

export default function MechanismPage() {
  const { currentAnchor } = useAnchorNavigation(DEFAULT_ANCHOR)
  const [state, setState] = useState<PageState>({
    status: 'loading',
    context: null,
    errorMessage: null,
  })

  useEffect(() => {
    let cancelled = false

    const loadContext = async () => {
      setState({ status: 'loading', context: null, errorMessage: null })

      if (!currentAnchor) {
        if (!cancelled) {
          setState({
            status: 'error',
            context: null,
            errorMessage: '锚点格式无效，请从探索页选择标注后跳转。',
          })
        }
        return
      }

      try {
        const context = await contentRepository.getContext(currentAnchor)
        if (!cancelled) {
          const hasContent = Boolean(context.mechanism)
          setState({
            status: hasContent ? 'ready' : 'empty',
            context,
            errorMessage: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            context: null,
            errorMessage:
              error instanceof Error ? error.message : '无法加载机制数据。',
          })
        }
      }
    }

    void loadContext()

    return () => {
      cancelled = true
    }
  }, [currentAnchor])

  const returnAnchor = state.context?.annotation?.links?.specimen
    ? state.context.annotation.anchor
    : (state.context?.mechanism?.anchor ?? null)

  return (
    <section className={styles.page} aria-labelledby="mechanism-page-title">
      <p className={styles.eyebrow}>机制分析</p>
      <h1 id="mechanism-page-title" tabIndex={-1} data-page-title="true">
        跟随疾病机制
      </h1>

      {state.status === 'loading' && (
        <div className={styles.status} role="status">
          正在加载机制数据…
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.status} role="alert">
          {state.errorMessage ?? '机制数据加载失败。'}
        </div>
      )}

      {state.status === 'empty' && (
        <div className={styles.status} role="status">
          当前锚点暂无机制数据，请从探索页选择标注后跳转。
        </div>
      )}

      {state.status === 'ready' && state.context && (
        <div className={styles.main}>
          <MechanismFlow mechanism={state.context.mechanism ?? null} />

          {returnAnchor && (
            <Link
              className={styles.backLink}
              to={`/explorer?anchor=${returnAnchor}`}
            >
              返回对应病理证据
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
