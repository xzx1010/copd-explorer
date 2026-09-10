import { useCallback } from 'react'

import styles from './ErrorState.module.css'

interface ErrorStateProps {
  message: string
  errorCode?:
    'NETWORK_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNKNOWN'
  onRetry?: () => void
}

const codeLabels: Record<string, string> = {
  NETWORK_ERROR: '网络错误',
  TIMEOUT: '请求超时',
  VALIDATION_ERROR: '数据格式异常',
  NOT_FOUND: '未找到',
  UNKNOWN: '未知错误',
}

export function ErrorState({
  message,
  errorCode = 'UNKNOWN',
  onRetry,
}: ErrorStateProps) {
  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  return (
    <div className={styles.container} role="alert">
      <div className={styles.header}>
        <span className={styles.code}>
          {codeLabels[errorCode] ?? errorCode}
        </span>
        <p className={styles.message}>{message}</p>
      </div>
      {onRetry && (
        <button
          className={styles.retryButton}
          onClick={handleRetry}
          type="button"
        >
          重新加载
        </button>
      )}
    </div>
  )
}
