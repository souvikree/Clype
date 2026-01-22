import { create } from 'zustand'

export interface TerminalTab {
  id: string
  type: 'chat' | 'voice' | 'video'
  username: string
  isActive: boolean
  roomId?: string
  sessionId?: string
  sessionCode?: string
  history: TerminalLine[]
  commandInput: string
  mateUsername?: string
}

export interface TerminalLine {
  id: string
  content: string
  type: 'prompt' | 'output' | 'message' | 'error' | 'system'
  author?: string
  timestamp: Date
}

export interface TerminalStore {
  tabs: TerminalTab[]
  activeTabId: string | null
  username: string
  setUsername: (username: string) => void
  addTab: (type: 'chat' | 'voice' | 'video') => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  addLine: (tabId: string, line: TerminalLine) => void
  setCommandInput: (tabId: string, input: string) => void
  updateTab: (id: string, updates: Partial<TerminalTab>) => void
  clearTabs: () => void
}

let tabCounter = 0

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  username: '',

  setUsername: (username: string) => set({ username }),

  addTab: (type: 'chat' | 'voice' | 'video') => {
    const { tabs, username } = get()
    const newTab: TerminalTab = {
      id: `tab-${++tabCounter}`,
      type,
      username,
      isActive: true,
      history: [
        {
          id: `line-0`,
          content: `${username} : ${type.charAt(0).toUpperCase() + type.slice(1)} >`,
          type: 'prompt',
          timestamp: new Date(),
        },
      ],
      commandInput: '',
    }

    // Deactivate other tabs
    const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }))
    updatedTabs.push(newTab)

    set({ tabs: updatedTabs, activeTabId: newTab.id })
  },

  removeTab: (id: string) => {
    const { tabs } = get()
    const updatedTabs = tabs.filter((tab) => tab.id !== id)

    // Set next active tab or first one
    let newActiveId = null
    if (updatedTabs.length > 0) {
      newActiveId = updatedTabs[0].id
      updatedTabs[0].isActive = true
    }

    set({ tabs: updatedTabs, activeTabId: newActiveId })
  },

  setActiveTab: (id: string) => {
    const { tabs } = get()
    const updatedTabs = tabs.map((tab) => ({
      ...tab,
      isActive: tab.id === id,
    }))
    set({ tabs: updatedTabs, activeTabId: id })
  },

  addLine: (tabId: string, line: TerminalLine) => {
    const { tabs } = get()
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        return {
          ...tab,
          history: [...tab.history, line],
        }
      }
      return tab
    })
    set({ tabs: updatedTabs })
  },

  setCommandInput: (tabId: string, input: string) => {
    const { tabs } = get()
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        return { ...tab, commandInput: input }
      }
      return tab
    })
    set({ tabs: updatedTabs })
  },

  updateTab: (id: string, updates: Partial<TerminalTab>) => {
    const { tabs } = get()
    const updatedTabs = tabs.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab))
    set({ tabs: updatedTabs })
  },

  clearTabs: () => {
    set({ tabs: [], activeTabId: null })
  },
}))
