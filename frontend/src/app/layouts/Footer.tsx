import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <MedicalDisclaimer />
      <div className={styles.inner}>
        <span>COPD Explorer</span>
        <span>教学用途</span>
      </div>
    </footer>
  )
}
