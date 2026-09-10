import type { CSSProperties } from 'react'

import type { HotspotData } from '../../types/content'
import styles from './HotspotMarker.module.css'

interface HotspotMarkerProps {
  hotspot: HotspotData
  selected?: boolean
  disabled?: boolean
  onSelect: (hotspot: HotspotData) => void
}

function getMarkerStyle(hotspot: HotspotData): CSSProperties {
  return {
    left: `${hotspot.x * 100}%`,
    top: `${hotspot.y * 100}%`,
    width: `${hotspot.width * 100}%`,
    height: `${hotspot.height * 100}%`,
  }
}

export function HotspotMarker({
  hotspot,
  selected = false,
  disabled = false,
  onSelect,
}: HotspotMarkerProps) {
  return (
    <button
      aria-pressed={selected}
      className={styles.marker}
      data-selected={selected ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => onSelect(hotspot)}
      style={getMarkerStyle(hotspot)}
      type="button"
    >
      <span className={styles.label}>{hotspot.label}</span>
      {selected && <span className={styles.selectedText}>已选中</span>}
    </button>
  )
}
