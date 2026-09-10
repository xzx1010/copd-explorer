import { useCallback, useState } from 'react'

import styles from './CaseInputForm.module.css'

export interface CaseFormData {
  age: string
  sex: string
  smokingHistory: string
  symptoms: string
  lungFunction: string
  ctDescription: string
}

interface CaseInputFormProps {
  initialData?: CaseFormData
  disabled?: boolean
  onSubmit: (data: CaseFormData) => void
}

const MAX_SYMPTOMS_LENGTH = 200
const MAX_SMOKING_LENGTH = 100
const MAX_TESTS_LENGTH = 200

const emptyForm: CaseFormData = {
  age: '',
  sex: '',
  smokingHistory: '',
  symptoms: '',
  lungFunction: '',
  ctDescription: '',
}

export function CaseInputForm({
  initialData = emptyForm,
  disabled = false,
  onSubmit,
}: CaseInputFormProps) {
  const [form, setForm] = useState<CaseFormData>(initialData)

  const updateField = useCallback(
    (field: keyof CaseFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()

      const trimmed: CaseFormData = {
        age: form.age.trim(),
        sex: form.sex.trim(),
        smokingHistory: form.smokingHistory.trim(),
        symptoms: form.symptoms.trim(),
        lungFunction: form.lungFunction.trim(),
        ctDescription: form.ctDescription.trim(),
      }

      // Must have at least age + sex + smoking + symptoms
      if (
        !trimmed.age ||
        !trimmed.sex ||
        !trimmed.smokingHistory ||
        !trimmed.symptoms
      ) {
        return
      }

      onSubmit(trimmed)
    },
    [form, onSubmit],
  )

  const isSubmittable =
    form.age.trim() &&
    form.sex.trim() &&
    form.smokingHistory.trim() &&
    form.symptoms.trim()

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <p className={styles.privacyNotice}>
        ⚠️
        请勿输入可识别真实患者身份的信息（如姓名、身份证号、住院号等）。本工具仅供教学练习使用。
      </p>

      <div className={styles.fields}>
        <label className={styles.label}>
          <span className={styles.labelText}>年龄（岁） *</span>
          <input
            className={styles.input}
            disabled={disabled}
            inputMode="numeric"
            maxLength={3}
            onChange={(e) =>
              updateField('age', e.target.value.replace(/\D/g, ''))
            }
            placeholder="例如：65"
            type="text"
            value={form.age}
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>性别 *</span>
          <select
            className={styles.select}
            disabled={disabled}
            onChange={(e) => updateField('sex', e.target.value)}
            value={form.sex}
          >
            <option value="">请选择</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
          </select>
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>
            吸烟史 *{' '}
            <span className={styles.charHint}>
              （最多 {MAX_SMOKING_LENGTH} 字）
            </span>
          </span>
          <input
            className={styles.input}
            disabled={disabled}
            maxLength={MAX_SMOKING_LENGTH}
            onChange={(e) => updateField('smokingHistory', e.target.value)}
            placeholder="例如：40 年，每日一包"
            type="text"
            value={form.smokingHistory}
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>
            主要症状 *{' '}
            <span className={styles.charHint}>
              （最多 {MAX_SYMPTOMS_LENGTH} 字）
            </span>
          </span>
          <textarea
            className={styles.textarea}
            disabled={disabled}
            maxLength={MAX_SYMPTOMS_LENGTH}
            onChange={(e) => updateField('symptoms', e.target.value)}
            placeholder="例如：慢性咳嗽、咳痰、活动后气促"
            rows={3}
            value={form.symptoms}
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>
            肺功能结果{' '}
            <span className={styles.charHint}>
              （最多 {MAX_TESTS_LENGTH} 字）
            </span>
          </span>
          <textarea
            className={styles.textarea}
            disabled={disabled}
            maxLength={MAX_TESTS_LENGTH}
            onChange={(e) => updateField('lungFunction', e.target.value)}
            placeholder="例如：FEV₁/FVC 0.62，支气管扩张试验阴性"
            rows={2}
            value={form.lungFunction}
          />
        </label>

        <label className={styles.label}>
          <span className={styles.labelText}>
            影像学描述{' '}
            <span className={styles.charHint}>
              （最多 {MAX_TESTS_LENGTH} 字）
            </span>
          </span>
          <textarea
            className={styles.textarea}
            disabled={disabled}
            maxLength={MAX_TESTS_LENGTH}
            onChange={(e) => updateField('ctDescription', e.target.value)}
            placeholder="例如：双肺透亮度增高，可见肺大疱"
            rows={2}
            value={form.ctDescription}
          />
        </label>
      </div>

      <button
        className={styles.submit}
        disabled={!isSubmittable || disabled}
        type="submit"
      >
        {disabled ? '分析中…' : '提交分析'}
      </button>
    </form>
  )
}
