import styles from './LoadingState.module.css'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = '正在加载内容…' }: LoadingStateProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.message}>{message}</p>
    </div>
  )
}
