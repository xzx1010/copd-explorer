import { Link } from 'react-router-dom'

import { parseAnchor } from '../../services/anchor'
import type { AIResult } from '../../types/ai'
import styles from './AIReport.module.css'

interface AIReportProps {
  result: AIResult
  /** Set of known-good anchor IDs, used to determine clickability. */
  validAnchorIds?: Set<string>
}

export function AIReport({ result, validAnchorIds }: AIReportProps) {
  return (
    <article className={styles.report} aria-labelledby="ai-report-title">
      <h2 id="ai-report-title" className={styles.title}>
        AI 分析报告
      </h2>

      {/* 1. Assessment */}
      <section className={styles.section} aria-labelledby="ai-assessment">
        <h3 id="ai-assessment" className={styles.sectionTitle}>
          疾病评估
        </h3>
        <div className={styles.assessmentGrid}>
          <div className={styles.assessmentItem}>
            <span className={styles.assessmentLabel}>疾病</span>
            <span className={styles.assessmentValue}>
              {result.assessment.disease}
            </span>
          </div>
          <div className={styles.assessmentItem}>
            <span className={styles.assessmentLabel}>可能性</span>
            <span className={styles.assessmentValue}>
              {result.assessment.likelihood === 'high'
                ? '高'
                : result.assessment.likelihood === 'medium'
                  ? '中'
                  : result.assessment.likelihood === 'low'
                    ? '低'
                    : '未知'}
            </span>
          </div>
          <div className={styles.assessmentItem}>
            <span className={styles.assessmentLabel}>置信度</span>
            <span className={styles.assessmentValue}>
              {Math.round(result.assessment.confidence * 100)}%
            </span>
          </div>
        </div>
        <div className={styles.assessmentBasis}>
          <h4 className={styles.subTitle}>病理依据</h4>
          <ul className={styles.list}>
            {result.assessment.basis.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. Evidence */}
      <section className={styles.section} aria-labelledby="ai-evidence">
        <h3 id="ai-evidence" className={styles.sectionTitle}>
          病理证据
        </h3>
        <ul className={styles.evidenceList}>
          {result.evidence.map((item) => {
            const parsed = parseAnchor(item.anchorId)
            const isValid =
              parsed.valid &&
              (!validAnchorIds || validAnchorIds.has(item.anchorId))

            return (
              <li className={styles.evidenceItem} key={item.anchorId}>
                <span className={styles.evidenceText}>{item.text}</span>
                {isValid ? (
                  <Link
                    className={styles.evidenceLink}
                    to={`/explorer?anchor=${item.anchorId}&from=ai`}
                  >
                    查看病理证据 →
                  </Link>
                ) : (
                  <span
                    className={styles.evidenceInvalid}
                    title="该证据锚点无法在当前内容中追溯"
                  >
                    无法追溯 · {item.anchorId}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* 3. Differential */}
      <section className={styles.section} aria-labelledby="ai-differential">
        <h3 id="ai-differential" className={styles.sectionTitle}>
          鉴别诊断
        </h3>
        <ul className={styles.list}>
          {result.differential.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {/* 4. Recommendation */}
      <section className={styles.section} aria-labelledby="ai-recommendation">
        <h3 id="ai-recommendation" className={styles.sectionTitle}>
          建议
        </h3>
        <ul className={styles.list}>
          {result.recommendation.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {/* 5. Disclaimer */}
      <aside className={styles.disclaimer} aria-label="免责声明">
        <p>{result.disclaimer}</p>
      </aside>
    </article>
  )
}
