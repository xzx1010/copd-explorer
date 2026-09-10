import { useEffect, useRef, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from './Footer'
import { Header } from './Header'
import styles from './AppShell.module.css'

interface AppShellProps {
  children?: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const pageTitle = document.querySelector<HTMLElement>(
      '[data-page-title="true"]',
    )

    ;(pageTitle ?? mainRef.current)?.focus()
  }, [location.pathname, location.search])

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        跳到主要内容
      </a>
      <Header />
      <main
        id="main-content"
        className={styles.main}
        ref={mainRef}
        tabIndex={-1}
      >
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
