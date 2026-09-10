import { Link } from 'react-router-dom'

import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <section className={styles.page} aria-labelledby="page-title">
      <p className={styles.code}>404</p>
      <h1 id="page-title" tabIndex={-1} data-page-title="true">
        页面不存在
      </h1>
      <p>这个学习页面不存在。返回首页选择一条支持的路径。</p>
      <Link className={styles.link} to="/">
        返回首页
      </Link>
    </section>
  )
}
