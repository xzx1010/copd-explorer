import { appErrorSchema, type AppError } from '../types/error'
import { apiRoot } from './config'

export interface ApiClientOptions {
  baseUrl?: string
  timeoutMs?: number
  signal?: AbortSignal
}

export interface ApiClient {
  get<T>(path: string, options?: ApiClientOptions): Promise<T>
  post<T>(path: string, body: unknown, options?: ApiClientOptions): Promise<T>
}

const defaultOptions: Required<
  Pick<ApiClientOptions, 'baseUrl' | 'timeoutMs'>
> = {
  baseUrl: apiRoot,
  timeoutMs: 5000,
}

function createAbortSignal(signal?: AbortSignal): AbortSignal | undefined {
  if (!signal) {
    return undefined
  }
  return signal
}

interface ServerErrorEnvelope {
  code?: string
  message?: string
}

function extractServerError(payload: unknown): ServerErrorEnvelope | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }
  const error = (payload as Record<string, unknown>).error
  if (!error || typeof error !== 'object') {
    return undefined
  }
  const envelope = error as Record<string, unknown>
  const result: ServerErrorEnvelope = {}
  if (typeof envelope.code === 'string') {
    result.code = envelope.code
  }
  if (typeof envelope.message === 'string') {
    result.message = envelope.message
  }
  return result
}

function extractTopLevelMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }
  const message = (payload as Record<string, unknown>).message
  return typeof message === 'string' ? message : undefined
}

function mapServerErrorCode(code: string | undefined): AppError['code'] {
  switch (code) {
    case 'VALIDATION_ERROR':
    case 'INVALID_REQUEST':
      return 'VALIDATION_ERROR'
    case 'CONTENT_NOT_FOUND':
      return 'NOT_FOUND'
    case 'AI_TIMEOUT':
      return 'TIMEOUT'
    case 'AI_SERVICE_ERROR':
    case 'INTERNAL_ERROR':
      return 'UNKNOWN'
    default:
      return 'NETWORK_ERROR'
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? defaultOptions.timeoutMs
  const controller = new AbortController()
  const signal = createAbortSignal(options.signal)
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(
      `${options.baseUrl ?? defaultOptions.baseUrl}${path}`,
      {
        ...init,
        signal: signal ?? controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init.headers ?? {}),
        },
      },
    )

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null)

      const serverError = extractServerError(payload)
      const message =
        serverError?.message ??
        extractTopLevelMessage(payload) ??
        '请求失败，请稍后重试。'

      const error = appErrorSchema.parse({
        code: mapServerErrorCode(serverError?.code),
        message,
        status: response.status,
      })
      throw error
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const abortedError = appErrorSchema.parse({
        code: 'TIMEOUT',
        message: '请求超时，请重试。',
        status: 408,
      })
      throw abortedError
    }
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      'status' in error
    ) {
      throw error as AppError
    }
    throw appErrorSchema.parse({
      code: 'UNKNOWN',
      message: '请求发生未知错误，请重试。',
      status: 500,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const apiClient: ApiClient = {
  async get<T>(path: string, options: ApiClientOptions = {}) {
    return requestJson<T>(path, { method: 'GET' }, options)
  },
  async post<T>(path: string, body: unknown, options: ApiClientOptions = {}) {
    return requestJson<T>(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      },
      options,
    )
  },
}
