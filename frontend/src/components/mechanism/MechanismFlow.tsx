import { useCallback, useState } from 'react'

import type { MechanismData } from '../../types/content'
import { MechanismNodeCard } from './MechanismNodeCard'
import styles from './MechanismFlow.module.css'

interface MechanismFlowProps {
  mechanism: MechanismData | null
}

export function MechanismFlow({ mechanism }: MechanismFlowProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  if (!mechanism) {
    return (
      <div className={styles.empty} role="status">
        当前暂无机制数据，选择标注后可查看疾病机制通路。
      </div>
    )
  }

  return (
    <div className={styles.flow} aria-labelledby="mechanism-flow-title">
      <h3 id="mechanism-flow-title" className={styles.title}>
        {mechanism.title}
      </h3>
      <p className={styles.summary}>{mechanism.summary}</p>
      <div className={styles.nodes}>
        {mechanism.nodes.map((node) => (
          <MechanismNodeCard
            expanded={expandedNodes.has(node.id)}
            key={node.id}
            node={node}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
