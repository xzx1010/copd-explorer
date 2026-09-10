import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ClinicalCard } from '../../components/clinical/ClinicalCard'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { MechanismFlow } from '../../components/mechanism/MechanismFlow'
import { SlideViewer } from '../../components/slide/SlideViewer'
import { SpecimenViewer } from '../../components/specimen/SpecimenViewer'
import { useAnchorNavigation } from '../../hooks/useAnchorNavigation'
import { contentRepository } from '../../services/content'
import { useAIStore } from '../../stores/aiStore'
import type {
  AnnotationData,
  ExplorerContext,
  HotspotData,
} from '../../types/content'
import styles from './ExplorerPage.module.css'

const DEFAULT_CONTEXT_ANCHOR = 'anchor_specimen'

function deriveErrorCode(msg: string): ExplorerState['errorCode'] {
  if (msg.includes('TIMEOUT') || msg.includes('超时') || msg.includes('408'))
    return 'TIMEOUT'
  if (msg.includes('NOT_FOUND') || msg.includes('404')) return 'NOT_FOUND'
  if (msg.includes('NETWORK') || msg.includes('网络')) return 'NETWORK_ERROR'
  return 'UNKNOWN'
}

type ExplorerState = {
  status: 'loading' | 'ready' | 'empty' | 'error' | 'invalid'
  context: ExplorerContext | null
  errorMessage: string | null
  errorCode: 'NETWORK_ERROR' | 'TIMEOUT' | 'NOT_FOUND' | 'UNKNOWN' | null
}

export default function ExplorerPage() {
  const location = useLocation()
  const { currentAnchor, rawAnchor, navigateToAnchor } = useAnchorNavigation(
    DEFAULT_CONTEXT_ANCHOR,
  )
  const setReturnPosition = useAIStore((s) => s.setReturnPosition)

  const fromAI = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('from') === 'ai'
  }, [location.search])

  const [state, setState] = useState<ExplorerState>({
    status: 'loading',
    context: null,
    errorMessage: null,
    errorCode: null,
  })

  useEffect(() => {
    let cancelled = false

    const loadContext = async () => {
      setState({
        status: 'loading',
        context: null,
        errorMessage: null,
        errorCode: null,
      })

      // Invalid anchor format → show recovery UI
      if (!currentAnchor) {
        if (!cancelled) {
          setState({
            status: 'invalid',
            context: null,
            errorMessage: `"${rawAnchor}" 不是有效的锚点格式。`,
            errorCode: null,
          })
        }
        return
      }

      try {
        const context = await contentRepository.getContext(currentAnchor)
        if (!cancelled) {
          const hasContent = Boolean(
            context.specimen ||
            context.slide ||
            context.annotation ||
            context.mechanism ||
            context.clinical,
          )
          setState({
            status: hasContent ? 'ready' : 'empty',
            context,
            errorMessage: null,
            errorCode: null,
          })

          // Persist return position so AI flow can come back here
          if (context.annotation?.anchor) {
            setReturnPosition(context.annotation.anchor)
          }
        }
      } catch (error) {
        if (!cancelled) {
          const msg =
            error instanceof Error ? error.message : '无法加载探索上下文。'
          setState({
            status: 'error',
            context: null,
            errorMessage: msg,
            errorCode: deriveErrorCode(msg),
          })
        }
      }
    }

    void loadContext()

    return () => {
      cancelled = true
    }
  }, [currentAnchor, rawAnchor, setReturnPosition])

  const breadcrumbItems = useMemo(() => {
    const context = state.context
    if (!context) {
      return []
    }

    return [
      { label: '探索', current: false },
      {
        label: context.specimen?.title ?? '标本',
        current: !context.annotation && !context.mechanism && !context.clinical,
      },
      {
        label: context.slide?.title ?? '切片',
        current:
          Boolean(context.slide) && !context.annotation && !context.mechanism,
      },
      {
        label: context.annotation?.name ?? '病理解释',
        current: Boolean(context.annotation),
      },
    ]
  }, [state.context])

  const handleHotspotSelect = (hotspot: HotspotData) => {
    navigateToAnchor(hotspot.anchor)
  }

  const handleAnnotationSelect = (annotation: AnnotationData) => {
    navigateToAnchor(annotation.anchor)
  }

  const handleRetry = () => {
    // Trigger a re-load by re-navigating to the same anchor
    if (currentAnchor) {
      navigateToAnchor(currentAnchor)
    } else {
      // Fallback: navigate to default
      navigateToAnchor(DEFAULT_CONTEXT_ANCHOR)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="explorer-title">
      <div className={styles.breadcrumb} aria-label="路径导航">
        {breadcrumbItems.length > 0 ? (
          breadcrumbItems.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              className={`${styles.breadcrumbItem} ${item.current ? styles.breadcrumbItemCurrent : ''}`}
            >
              {item.label}
              {index < breadcrumbItems.length - 1 ? ' /' : ''}
            </span>
          ))
        ) : (
          <span className={styles.breadcrumbItem}>探索病理上下文</span>
        )}
      </div>

      <h1 id="explorer-title" tabIndex={-1} data-page-title="true">
        探索病理上下文
      </h1>

      {fromAI && (
        <div className={styles.fromAiBanner}>
          <span className={styles.fromAiLabel}>来自 AI 分析</span>
          <Link className={styles.fromAiLink} to="/ai">
            返回 AI 分析
          </Link>
        </div>
      )}

      {state.status === 'loading' && (
        <LoadingState message="正在加载探索上下文…" />
      )}

      {state.status === 'invalid' && (
        <ErrorState
          errorCode="VALIDATION_ERROR"
          message={state.errorMessage ?? '锚点格式无效。'}
          onRetry={() => navigateToAnchor(DEFAULT_CONTEXT_ANCHOR)}
        />
      )}

      {state.status === 'error' && (
        <ErrorState
          errorCode={state.errorCode ?? 'UNKNOWN'}
          message={state.errorMessage ?? '内容加载失败。'}
          onRetry={handleRetry}
        />
      )}

      {state.status === 'empty' && (
        <EmptyState message="当前锚点暂无可显示内容，你可以返回首页或选择其他热区继续浏览。" />
      )}

      {state.status === 'ready' && state.context && (
        <div className={styles.grid}>
          <section
            className={styles.card}
            aria-labelledby="specimen-section-title"
          >
            <h2 id="specimen-section-title" className={styles.cardTitle}>
              标本区域
            </h2>
            <p className={styles.cardBody}>
              {state.context.specimen?.title ?? '当前上下文未提供标本信息。'}
            </p>
            <SpecimenViewer
              hotspots={state.context.hotspots}
              onSelectHotspot={handleHotspotSelect}
              selectedAnchor={state.context.anchor}
              specimen={state.context.specimen ?? null}
            />
            <ul className={styles.list}>
              <li className={styles.listItem}>锚点：{state.context.anchor}</li>
              <li className={styles.listItem}>
                标本描述：
                {state.context.specimen?.altText ?? '使用默认内容数据。'}
              </li>
            </ul>
          </section>

          <section
            className={styles.card}
            aria-labelledby="slide-section-title"
          >
            <h2 id="slide-section-title" className={styles.cardTitle}>
              切片区域
            </h2>
            <SlideViewer
              annotations={state.context.slideAnnotations}
              onSelectAnnotation={handleAnnotationSelect}
              selectedAnchor={state.context.anchor}
              slide={state.context.slide ?? null}
            />
            <ul className={styles.list}>
              <li className={styles.listItem}>
                切片锚点：{state.context.slide?.anchor ?? '—'}
              </li>
              <li className={styles.listItem}>
                说明：
                {state.context.annotation?.description ?? '等待后续关联标注。'}
              </li>
            </ul>
          </section>

          <section
            className={styles.card}
            aria-labelledby="explanation-section-title"
          >
            <h2 id="explanation-section-title" className={styles.cardTitle}>
              病理解释
            </h2>
            <p className={styles.cardBody}>
              {state.context.annotation?.description ??
                '当前还没有可展示的病理标注。'}
            </p>
          </section>

          <section
            className={styles.card}
            aria-labelledby="mechanism-section-title"
          >
            <h2 id="mechanism-section-title" className={styles.cardTitle}>
              机制通路
            </h2>
            <MechanismFlow mechanism={state.context.mechanism ?? null} />
          </section>

          <section
            className={styles.card}
            aria-labelledby="clinical-section-title"
          >
            <h2 id="clinical-section-title" className={styles.cardTitle}>
              临床表现
            </h2>
            <ClinicalCard clinical={state.context.clinical ?? null} />
          </section>
        </div>
      )}
    </section>
  )
}
