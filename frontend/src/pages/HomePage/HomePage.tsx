import { Link } from 'react-router-dom'

import { defaultContentBundle } from '../../data/content'
import styles from './HomePage.module.css'

const homeContent = defaultContentBundle.home

const capabilities = [
  '从标本到临床的证据链叙事',
  '基于热区的病理发现导航',
  '机制与临床卡片的深度解读',
]

export default function HomePage() {
  return (
    <section className={styles.page} aria-labelledby="home-title">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>COPD 病理学习</p>
          <h1 id="home-title" tabIndex={-1} data-page-title="true">
            {homeContent.title}
          </h1>
          <p className={styles.description}>{homeContent.subtitle}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} to="/explorer">
              开始探索
            </Link>
            <Link className={styles.secondaryAction} to="/mechanism">
              查看机制路径
            </Link>
          </div>
        </div>
        <aside className={styles.notice} aria-label="医学提示">
          <h2>医学提示</h2>
          <p>本体验仅用于教育与学习，需结合专业临床判断使用。</p>
        </aside>
      </div>

      <section className={styles.section} aria-labelledby="learning-path-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>学习路径</p>
          <h2 id="learning-path-title">四步引导式学习流</h2>
        </div>
        <ol className={styles.pathList}>
          {homeContent.learningPath.map((item, index) => (
            <li key={item.id} className={styles.pathItem}>
              <span className={styles.pathIndex}>{index + 1}</span>
              <div>
                <h3>{item.name}</h3>
                <p>{item.type}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="capabilities-title">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>核心能力</p>
          <h2 id="capabilities-title">面向证据驱动教学的设计</h2>
        </div>
        <ul className={styles.capabilitiesList}>
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}
