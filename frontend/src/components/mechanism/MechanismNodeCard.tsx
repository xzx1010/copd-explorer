import { useCallback } from 'react'

import styles from './MechanismNodeCard.module.css'

export interface MechanismNode {
  id: string
  title: string
  description: string
}

interface MechanismNodeCardProps {
  node: MechanismNode
  expanded?: boolean
  onToggle: (nodeId: string) => void
}

export function MechanismNodeCard({
  node,
  expanded = false,
  onToggle,
}: MechanismNodeCardProps) {
  const handleToggle = useCallback(() => {
    onToggle(node.id)
  }, [node.id, onToggle])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onToggle(node.id)
      }
    },
    [node.id, onToggle],
  )

  return (
    <div
      aria-expanded={expanded}
      className={styles.node}
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        aria-label={`${node.title}：${expanded ? '收起说明' : '展开说明'}`}
        className={styles.trigger}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className={styles.arrow} aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        <span className={styles.nodeTitle}>{node.title}</span>
      </button>
      {expanded && <p className={styles.description}>{node.description}</p>}
    </div>
  )
}
