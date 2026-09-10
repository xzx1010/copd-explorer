import { Component, type ReactNode } from 'react'

import { ErrorState } from '../../components/common/ErrorState'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // Never log patient data – only log framework-level errors in dev
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error.message)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.page} aria-labelledby="error-title">
          <section className={styles.card}>
            <p className={styles.eyebrow}>COPD Explorer</p>
            <h1 id="error-title" tabIndex={-1} data-page-title="true">
              页面出错了
            </h1>
            <ErrorState
              errorCode="UNKNOWN"
              message="当前页面遇到了意外错误，你可以尝试重新加载页面或返回首页继续浏览。"
              onRetry={this.handleReset}
            />
            <a className={styles.link} href="/">
              返回首页
            </a>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
