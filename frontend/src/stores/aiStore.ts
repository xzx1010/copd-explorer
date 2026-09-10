import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AIResult } from '../types/ai'

interface AIStoreState {
  /** Current case input draft – preserved across page refreshes. */
  draft: string

  /** Most recent AI analysis result, if any. */
  lastResult: AIResult | null

  /** The anchor the user should return to when coming back from AI. */
  returnPosition: string | null

  setDraft: (draft: string) => void
  setLastResult: (result: AIResult | null) => void
  setReturnPosition: (anchor: string | null) => void
  clearAll: () => void
}

const initialState = {
  draft: '',
  lastResult: null,
  returnPosition: null,
} as const

export const useAIStore = create<AIStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setDraft: (draft) => set({ draft }),

      setLastResult: (result) => set({ lastResult: result }),

      setReturnPosition: (anchor) => set({ returnPosition: anchor }),

      clearAll: () => set({ ...initialState }),
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
