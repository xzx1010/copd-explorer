import styles from './MedicalDisclaimer.module.css'

export function MedicalDisclaimer() {
  return (
    <aside className={styles.disclaimer} aria-label="医学免责声明">
      <p>
        <strong>医学免责声明：</strong>
        本产品仅为教学和学术用途，所有分析结果不构成临床诊断、治疗建议或医疗决策依据。在任何实际临床场景中，均需由具备执业资质的医师结合患者个体情况做出判断。
      </p>
    </aside>
  )
}
