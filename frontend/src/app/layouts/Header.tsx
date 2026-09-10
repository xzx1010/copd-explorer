import { NavLink } from 'react-router-dom'

import styles from './Header.module.css'

const navigation = [
  { to: '/', label: '首页', end: true },
  { to: '/explorer', label: '探索' },
  { to: '/mechanism', label: '机制' },
  { to: '/ai', label: 'AI 练习' },
]

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink
          className={styles.brand ?? ''}
          to="/"
          aria-label="COPD Explorer 首页"
        >
          COPD Explorer
        </NavLink>
        <nav aria-label="主导航">
          <ul className={styles.navigation}>
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    isActive
                      ? `${styles.link ?? ''} ${styles.active ?? ''}`
                      : (styles.link ?? '')
                  }
                  {...(item.end === true ? { end: true } : {})}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
