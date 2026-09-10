import { explorerContextSchema, type ExplorerContext } from '../types/content'
import {
  defaultContentBundle,
  parseContentBundle,
  validateContentBundle,
  type ContentBundle,
} from '../data/content'
import { hasAnchor } from './anchor'
import { apiClient } from './apiClient'
import { useMockApi } from './config'

export interface ContentRepository {
  getHomeContent(): Promise<unknown>
  getContext(anchorId?: string): Promise<ExplorerContext>
}

export class StaticContentRepository implements ContentRepository {
  constructor(private readonly bundle: ContentBundle = defaultContentBundle) {}

  async getHomeContent() {
    return this.bundle.home
  }

  async getContext(anchorId?: string): Promise<ExplorerContext> {
    const parsedBundle = parseContentBundle(this.bundle)
    const validation = validateContentBundle(parsedBundle)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    const anchor = anchorId ?? this.bundle.anchors[0]?.id ?? 'anchor_specimen'
    if (!hasAnchor(anchor, this.bundle.anchors)) {
      return explorerContextSchema.parse({
        anchor,
        specimen: null,
        hotspots: [],
        slide: null,
        annotation: null,
        mechanism: null,
        clinical: null,
      })
    }

    const specimen = this.bundle.specimens[0] ?? null
    const hotspots = specimen
      ? this.bundle.hotspots.filter((hotspot) =>
          specimen.hotspots.includes(hotspot.id),
        )
      : []
    const slide =
      this.bundle.slides.find((item) => item.anchor === anchor) ?? null
    const annotation =
      this.bundle.annotations.find((item) => item.anchor === anchor) ?? null
    const mechanism =
      this.bundle.mechanisms.find((item) => item.anchor === anchor) ?? null
    const clinical =
      this.bundle.clinical.find((item) => item.anchor === anchor) ?? null

    const fallbackSlide = annotation
      ? (this.bundle.slides.find(
          (item) => item.anchor === annotation.links.slide,
        ) ?? null)
      : null
    const fallbackMechanism = annotation
      ? (this.bundle.mechanisms.find(
          (item) => item.anchor === annotation.links.mechanism,
        ) ?? null)
      : null
    const fallbackClinical = annotation
      ? (this.bundle.clinical.find(
          (item) => item.anchor === annotation.links.clinical,
        ) ?? null)
      : null
    const resolvedSlide = slide ?? fallbackSlide

    const slideAnnotations = resolvedSlide
      ? this.bundle.annotations.filter(
          (item) => item.links.slide === resolvedSlide.anchor,
        )
      : []

    return explorerContextSchema.parse({
      anchor,
      specimen: specimen ?? null,
      hotspots,
      slide: resolvedSlide,
      slideAnnotations,
      annotation: annotation ?? null,
      mechanism: mechanism ?? fallbackMechanism,
      clinical: clinical ?? fallbackClinical,
    })
  }
}

export class RemoteContentRepository implements ContentRepository {
  async getHomeContent() {
    return apiClient.get<unknown>('/content/home')
  }

  async getContext(anchorId?: string): Promise<ExplorerContext> {
    const anchorPath = anchorId ? encodeURIComponent(anchorId) : 'default'
    const payload = await apiClient.get<unknown>(
      `/content/anchor/${anchorPath}`,
    )
    return explorerContextSchema.parse(payload)
  }
}

export const contentRepository: ContentRepository = useMockApi
  ? new StaticContentRepository()
  : new RemoteContentRepository()
