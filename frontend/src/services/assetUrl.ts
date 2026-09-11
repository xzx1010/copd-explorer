/**
 * Resolve content asset paths returned by the API for both local development
 * and repository-hosted GitHub Pages deployments.
 *
 * The backend stores content paths such as `/content/placeholder.svg`. When
 * the frontend is served from `/copd-explorer/`, those root-relative paths
 * would otherwise point at the GitHub Pages domain root instead of this app.
 */
export function resolveAssetUrl(path: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(path)) {
    return path
  }

  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '')
  const relativePath = path.replace(/^\/+/, '')
  return `${base}/${relativePath}`
}
