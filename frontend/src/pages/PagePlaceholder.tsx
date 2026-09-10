import styles from './PagePlaceholder.module.css'

interface PagePlaceholderProps {
  eyebrow: string
  title: string
  description: string
}

export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <section className={styles.page} aria-labelledby="page-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="page-title" tabIndex={-1} data-page-title="true">
        {title}
      </h1>
      <p className={styles.description}>{description}</p>
    </section>
  )
}
