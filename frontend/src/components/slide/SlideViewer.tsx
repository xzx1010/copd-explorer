import { useCallback, useEffect, useRef, useState } from 'react'

import { resolveAssetUrl } from '../../services/assetUrl'
import type { AnnotationData, SlideData } from '../../types/content'
import { AnnotationLayer } from '../annotation/AnnotationLayer'
import styles from './SlideViewer.module.css'

interface SlideViewerProps {
  slide: SlideData | null
  annotations?: AnnotationData[]
  selectedAnchor?: string | null
  onSelectAnnotation?: (annotation: AnnotationData) => void
}

type ImageState = 'loading' | 'loaded' | 'error'

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.5

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function SlideViewer({
  slide,
  annotations = [],
  selectedAnchor = null,
  onSelectAnnotation,
}: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    panX: number
    panY: number
  } | null>(null)

  const slideKey = slide?.id ?? 'empty'
  const imageSource = slide ? resolveAssetUrl(slide.image) : null
  const [viewState, setViewState] = useState({
    slideKey,
    zoom: MIN_ZOOM,
    panX: 0,
    panY: 0,
    imageState: slide ? ('loading' as ImageState) : ('error' as ImageState),
  })
  const activeView =
    viewState.slideKey === slideKey
      ? viewState
      : {
          slideKey,
          zoom: MIN_ZOOM,
          panX: 0,
          panY: 0,
          imageState: slide
            ? ('loading' as ImageState)
            : ('error' as ImageState),
        }
  const zoom = activeView.zoom
  const panX = activeView.panX
  const panY = activeView.panY
  const imageState = activeView.imageState

  const handleZoomIn = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      zoom: clampZoom(prev.zoom + ZOOM_STEP),
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setViewState((prev) => {
      const zoom = clampZoom(prev.zoom - ZOOM_STEP)
      return {
        ...prev,
        zoom,
        panX: zoom === MIN_ZOOM ? 0 : prev.panX,
        panY: zoom === MIN_ZOOM ? 0 : prev.panY,
      }
    })
  }, [])

  const handleReset = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      zoom: MIN_ZOOM,
      panX: 0,
      panY: 0,
    }))
  }, [])

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault()

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const imageX = (mouseX - panX) / zoom
      const imageY = (mouseY - panY) / zoom

      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const newZoom = clampZoom(zoom + delta)

      const newPanX = mouseX - imageX * newZoom
      const newPanY = mouseY - imageY * newZoom

      setViewState((prev) => ({
        ...prev,
        zoom: newZoom,
        panX: newZoom <= MIN_ZOOM ? 0 : newPanX,
        panY: newZoom <= MIN_ZOOM ? 0 : newPanY,
      }))
    },
    [zoom, panX, panY],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (zoom <= MIN_ZOOM) return
      event.preventDefault()
      setDragging(true)
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        panX,
        panY,
      }
    },
    [zoom, panX, panY],
  )

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) return
      const dx = event.clientX - dragRef.current.startX
      const dy = event.clientY - dragRef.current.startY
      setViewState((prev) => ({
        ...prev,
        panX: dragRef.current!.panX + dx,
        panY: dragRef.current!.panY + dy,
      }))
    }

    const handleMouseUp = () => {
      setDragging(false)
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  useEffect(() => {
    const image = imageRef.current
    if (image?.complete && image.naturalWidth > 0) {
      setViewState((prev) => ({ ...prev, imageState: 'loaded' }))
    }
  }, [slideKey])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (zoom <= MIN_ZOOM) return

      const step = 20
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          setViewState((prev) => ({ ...prev, panY: prev.panY + step }))
          break
        case 'ArrowDown':
          event.preventDefault()
          setViewState((prev) => ({ ...prev, panY: prev.panY - step }))
          break
        case 'ArrowLeft':
          event.preventDefault()
          setViewState((prev) => ({ ...prev, panX: prev.panX + step }))
          break
        case 'ArrowRight':
          event.preventDefault()
          setViewState((prev) => ({ ...prev, panX: prev.panX - step }))
          break
      }
    },
    [zoom],
  )

  const handleImageError = useCallback(() => {
    setViewState((prev) => ({ ...prev, slideKey, imageState: 'error' }))
  }, [slideKey])

  const handleImageLoad = useCallback(() => {
    setViewState((prev) => ({ ...prev, slideKey, imageState: 'loaded' }))
  }, [slideKey])

  const handleRetry = useCallback(() => {
    setViewState((prev) => ({ ...prev, slideKey, imageState: 'loading' }))
    // Force image reload by appending a cache-busting query
    if (imageRef.current && imageSource) {
      imageRef.current.src = imageSource
    }
  }, [imageSource, slideKey])

  const isZoomed = zoom > MIN_ZOOM

  if (!slide) {
    return (
      <div className={styles.empty} role="status">
        当前没有可显示的切片图像。
      </div>
    )
  }

  return (
    <figure className={styles.figure}>
      <div
        aria-label={`切片：${slide.title}`}
        className={styles.viewer}
        data-dragging={dragging ? 'true' : 'false'}
        data-image-state={imageState}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        ref={containerRef}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: container needs focus for keyboard pan
        tabIndex={imageState === 'loaded' ? 0 : undefined}
      >
        <div
          className={styles.canvas}
          data-visible={imageState === 'loaded' ? 'true' : 'false'}
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }}
        >
          <img
            alt={slide.altText ?? slide.title}
            className={styles.image}
            draggable={false}
            key={slide.id}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            ref={imageRef}
            src={imageSource ?? undefined}
            style={{
              cursor: isZoomed ? (dragging ? 'grabbing' : 'grab') : 'default',
            }}
          />
          {onSelectAnnotation && (
            <AnnotationLayer
              annotations={annotations}
              onSelectAnnotation={onSelectAnnotation}
              selectedAnchor={selectedAnchor}
            />
          )}
        </div>

        {imageState === 'loading' && (
          <div className={styles.message} role="status">
            正在加载切片图像…
          </div>
        )}

        {imageState === 'error' && (
          <div className={styles.message} role="alert">
            <p>切片图像暂时无法加载。</p>
            <button
              className={styles.retryButton}
              onClick={handleRetry}
              type="button"
            >
              重新加载
            </button>
          </div>
        )}
      </div>

      <figcaption className={styles.caption}>
        {slide.title} · 缩放 {zoom.toFixed(1)}×
      </figcaption>

      {imageState === 'loaded' && (
        <div className={styles.controls}>
          <button
            aria-label="放大"
            className={styles.controlButton}
            disabled={zoom >= MAX_ZOOM}
            onClick={handleZoomIn}
            type="button"
          >
            +
          </button>
          <button
            aria-label="缩小"
            className={styles.controlButton}
            disabled={zoom <= MIN_ZOOM}
            onClick={handleZoomOut}
            type="button"
          >
            −
          </button>
          <button
            aria-label="复位视图"
            className={styles.controlButton}
            disabled={!isZoomed}
            onClick={handleReset}
            type="button"
          >
            复位
          </button>
        </div>
      )}
    </figure>
  )
}
