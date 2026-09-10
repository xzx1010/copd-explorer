const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const apiRoot = configuredApiBaseUrl
  ? `${configuredApiBaseUrl.replace(/\/+$/, '')}/api`
  : '/api'

export const useMockApi = ['true', '1'].includes(
  (import.meta.env.VITE_USE_MOCK_API ?? '').trim().toLowerCase(),
)
