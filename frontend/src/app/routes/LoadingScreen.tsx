import styles from './LoadingScreen.module.css'

export function LoadingScreen() {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p>正在加载页面…</p>
    </div>
  )
}
