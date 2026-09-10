import type { ClinicalData } from '../../types/content'
import styles from './ClinicalCard.module.css'

interface ClinicalCardProps {
  clinical: ClinicalData | null
}

export function ClinicalCard({ clinical }: ClinicalCardProps) {
  if (!clinical) {
    return (
      <div className={styles.empty} role="status">
        当前暂无临床数据，选择标注后可查看对应临床表现与治疗启示。
      </div>
    )
  }

  return (
    <article className={styles.card} aria-labelledby="clinical-title">
      <h3 id="clinical-title" className={styles.title}>
        {clinical.title}
      </h3>
      <p className={styles.summary}>{clinical.summary}</p>

      <div className={styles.grid}>
        <section className={styles.section} aria-labelledby="clinical-impact">
          <h4 id="clinical-impact" className={styles.sectionTitle}>
            功能影响
          </h4>
          <p className={styles.sectionBody}>{clinical.impact}</p>
        </section>

        <section className={styles.section} aria-labelledby="clinical-symptoms">
          <h4 id="clinical-symptoms" className={styles.sectionTitle}>
            临床表现
          </h4>
          <ul className={styles.tagList}>
            {clinical.symptoms.map((item) => (
              <li className={styles.tag} key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          className={styles.section}
          aria-labelledby="clinical-treatment"
        >
          <h4 id="clinical-treatment" className={styles.sectionTitle}>
            治疗启示
          </h4>
          <ul className={styles.tagList}>
            {clinical.treatment.map((item) => (
              <li className={styles.tag} key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          className={styles.section}
          aria-labelledby="clinical-prevention"
        >
          <h4 id="clinical-prevention" className={styles.sectionTitle}>
            预防建议
          </h4>
          <ul className={styles.tagList}>
            {clinical.prevention.map((item) => (
              <li className={styles.tag} key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
