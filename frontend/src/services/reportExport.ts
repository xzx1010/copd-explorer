import type { CaseFormData } from '../components/ai/CaseInputForm'
import type { AIResult } from '../types/ai'

const likelihoodLabels: Record<AIResult['assessment']['likelihood'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  unknown: '未知',
}

function listLines(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

export function buildTextReport(form: CaseFormData, result: AIResult): string {
  return [
    'COPD Explorer AI 教学分析报告',
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '【病例信息】',
    `年龄：${form.age} 岁`,
    `性别：${form.sex}`,
    `吸烟史：${form.smokingHistory}`,
    `主要症状：${form.symptoms}`,
    `肺功能：${form.lungFunction || '未填写'}`,
    `影像学描述：${form.ctDescription || '未填写'}`,
    '',
    '【疾病评估】',
    `疾病：${result.assessment.disease}`,
    `可能性：${likelihoodLabels[result.assessment.likelihood]}`,
    `置信度：${Math.round(result.assessment.confidence * 100)}%`,
    '',
    '【分析依据】',
    listLines(result.assessment.basis),
    '',
    '【病理证据】',
    result.evidence
      .map((item, index) => `${index + 1}. ${item.text}（${item.anchorId}）`)
      .join('\n'),
    '',
    '【鉴别诊断】',
    listLines(result.differential),
    '',
    '【建议】',
    listLines(result.recommendation),
    '',
    '【免责声明】',
    result.disclaimer,
  ].join('\n')
}

export function downloadTextReport(form: CaseFormData, result: AIResult) {
  const content = buildTextReport(form, result)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `COPD-AI-教学报告-${date}.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Open the browser print dialog; users can select "Save as PDF". */
export function printReportAsPdf() {
  const previousTitle = document.title
  document.title = 'COPD Explorer AI 教学分析报告'
  document.body.classList.add('printing-ai-report')

  try {
    window.print()
  } finally {
    document.body.classList.remove('printing-ai-report')
    document.title = previousTitle
  }
}
