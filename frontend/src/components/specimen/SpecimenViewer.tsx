import { useState } from 'react'

import { resolveAssetUrl } from '../../services/assetUrl'
import type { HotspotData, SpecimenData } from '../../types/content'
import { HotspotMarker } from './HotspotMarker'
import styles from './SpecimenViewer.module.css'

interface SpecimenViewerProps {
  specimen: SpecimenData | null
  hotspots: HotspotData[]
  selectedAnchor?: string | null
  onSelectHotspot: (hotspot: HotspotData) => void
}

type ImageState = 'loading' | 'loaded' | 'error'

export function SpecimenViewer({
  specimen,
  hotspots,
  selectedAnchor = null,
  onSelectHotspot,
}: SpecimenViewerProps) {
  const imageSource = specimen ? resolveAssetUrl(specimen.image) : null
  const [imageStatus, setImageStatus] = useState<{
    source: string | null
    state: ImageState
  }>({
    source: imageSource,
    state: specimen ? 'loading' : 'error',
  })
  const imageState =
    imageStatus.source === imageSource
      ? imageStatus.state
      : specimen
        ? 'loading'
        : 'error'

  if (!specimen) {
    return (
      <div className={styles.empty} role="status">
        当前没有可显示的标本图像。
      </div>
    )
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.stage} data-image-state={imageState}>
        <img
          alt={specimen.altText ?? specimen.title}
          className={styles.image}
          loading="eager"
          onError={() =>
            setImageStatus({ source: imageSource, state: 'error' })
          }
          onLoad={() =>
            setImageStatus({ source: imageSource, state: 'loaded' })
          }
          src={imageSource ?? undefined}
        />
        {imageState === 'loaded' && (
          <div className={styles.overlay} aria-label="标本热区">
            {hotspots.map((hotspot) => (
              <HotspotMarker
                key={hotspot.id}
                disabled={!hotspot.anchor}
                hotspot={hotspot}
                onSelect={onSelectHotspot}
                selected={hotspot.anchor === selectedAnchor}
              />
            ))}
          </div>
        )}
        {imageState === 'loading' && (
          <div className={styles.message} role="status">
            正在加载标本图像…
          </div>
        )}
        {imageState === 'error' && (
          <div className={styles.message} role="alert">
            标本图像暂时无法加载，热区已暂停显示。
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        {specimen.title} · 选择图中热区查看对应病理内容
      </figcaption>
    </figure>
  )
}
