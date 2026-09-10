import type { CSSProperties } from 'react'

import type { AnnotationData } from '../../types/content'
import styles from './AnnotationLayer.module.css'

interface AnnotationLayerProps {
  annotations: AnnotationData[]
  selectedAnchor?: string | null
  onSelectAnnotation: (annotation: AnnotationData) => void
}

function getMarkerStyle(pos: AnnotationData['slidePosition']): CSSProperties {
  if (!pos) return {}
  return {
    left: `${pos.x * 100}%`,
    top: `${pos.y * 100}%`,
    width: `${pos.width * 100}%`,
    height: `${pos.height * 100}%`,
  }
}

export function AnnotationLayer({
  annotations,
  selectedAnchor = null,
  onSelectAnnotation,
}: AnnotationLayerProps) {
  const positionedAnnotations = annotations.filter((a) => a.slidePosition)

  if (positionedAnnotations.length === 0) {
    return (
      <div className={styles.empty} role="status">
        当前切片暂无标注区域。
      </div>
    )
  }

  return (
    <div className={styles.layer} aria-label="切片标注层" role="group">
      {positionedAnnotations.map((annotation) => {
        const isSelected = annotation.anchor === selectedAnchor

        return (
          <button
            aria-label={
              isSelected ? `${annotation.name}（已选中）` : annotation.name
            }
            aria-pressed={isSelected}
            className={styles.marker}
            data-selected={isSelected ? 'true' : 'false'}
            key={annotation.id}
            onClick={() => onSelectAnnotation(annotation)}
            style={getMarkerStyle(annotation.slidePosition)}
            type="button"
          >
            <span className={styles.label}>{annotation.name}</span>
          </button>
        )
      })}
    </div>
  )
}
