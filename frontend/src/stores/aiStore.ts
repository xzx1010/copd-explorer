import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AIResult } from '../types/ai'

import type { CaseFormData } from '../components/ai/CaseInputForm'

export interface AIHistoryEntry {
  id: string
  createdAt: string
  form: CaseFormData
  result: AIResult
}

const HISTORY_STORAGE_KEY = 'copd-explorer-ai-history'

function loadHistory(): AIHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AIHistoryEntry[]).slice(0, 20) : []
  } catch {
    return []
  }
}

function saveHistory(history: AIHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Storage can be disabled or full; the in-memory history still works.
  }
}

function createHistoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface AIStoreState {
  /** Current case input draft – preserved across page refreshes. */
  draft: string

  /** Most recent AI analysis result, if any. */
  lastResult: AIResult | null

  /** The anchor the user should return to when coming back from AI. */
  returnPosition: string | null

  /** Recent successful analyses, retained locally on this device. */
  history: AIHistoryEntry[]

  setDraft: (draft: string) => void
  setLastResult: (result: AIResult | null) => void
  setReturnPosition: (anchor: string | null) => void
  addHistory: (entry: Omit<AIHistoryEntry, 'id' | 'createdAt'>) => void
  loadHistoryEntry: (entry: AIHistoryEntry) => void
  clearHistory: () => void
  clearAll: () => void
}

const initialState = {
  draft: '',
  lastResult: null,
  returnPosition: null,
  history: loadHistory(),
} as const

export const useAIStore = create<AIStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setDraft: (draft) => set({ draft }),

      setLastResult: (result) => set({ lastResult: result }),

      setReturnPosition: (anchor) => set({ returnPosition: anchor }),

      addHistory: (entry) =>
        set((state) => {
          const next: AIHistoryEntry[] = [
            {
              ...entry,
              id: createHistoryId(),
              createdAt: new Date().toISOString(),
            },
            ...state.history,
          ].slice(0, 20)
          saveHistory(next)
          return { history: next }
        }),

      loadHistoryEntry: (entry) =>
        set({
          draft: JSON.stringify(entry.form),
          lastResult: entry.result,
        }),

      clearHistory: () => {
        saveHistory([])
        set({ history: [] })
      },

      clearAll: () => {
        saveHistory([])
        set({ ...initialState, history: [] })
      },
    }),
    {
      name: 'copd-explorer-ai-store',
      // Only persist to sessionStorage so the state is cleared when
      // the browsing session ends.
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key)
          return value ? JSON.parse(value) : null
        },
        setItem: (key, value) => {
          sessionStorage.setItem(key, JSON.stringify(value))
        },
        removeItem: (key) => {
          sessionStorage.removeItem(key)
        },
      },
    },
  ),
)
