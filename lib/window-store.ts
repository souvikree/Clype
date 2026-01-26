import { create } from 'zustand'

export interface WindowState {
  id: string
  type: 'voice' | 'video'
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

interface WindowStore {
  windows: WindowState[]
  highestZIndex: number
  
  openWindow: (id: string, type: 'voice' | 'video') => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  bringToFront: (id: string) => void
  updatePosition: (id: string, position: { x: number; y: number }) => void
  updateSize: (id: string, size: { width: number; height: number }) => void
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  highestZIndex: 1000,

  openWindow: (id, type) => {
    const { windows, highestZIndex } = get()
    
    // Don't open duplicate windows
    if (windows.find(w => w.id === id)) return

    const newWindow: WindowState = {
      id,
      type,
      isMinimized: false,
      isMaximized: false,
      position: { 
        x: window.innerWidth / 2 - (type === 'video' ? 400 : 300),
        y: window.innerHeight / 2 - (type === 'video' ? 300 : 250)
      },
      size: { 
        width: type === 'video' ? 800 : 600,
        height: type === 'video' ? 600 : 500
      },
      zIndex: highestZIndex + 1
    }

    set({
      windows: [...windows, newWindow],
      highestZIndex: highestZIndex + 1
    })
  },

  closeWindow: (id) => {
    set(state => ({
      windows: state.windows.filter(w => w.id !== id)
    }))
  },

  minimizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true } : w
      )
    }))
  },

  maximizeWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMaximized: true, isMinimized: false } : w
      )
    }))
  },

  restoreWindow: (id) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w
      )
    }))
  },

  bringToFront: (id) => {
    const { highestZIndex } = get()
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, zIndex: highestZIndex + 1 } : w
      ),
      highestZIndex: highestZIndex + 1
    }))
  },

  updatePosition: (id, position) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, position } : w
      )
    }))
  },

  updateSize: (id, size) => {
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, size } : w
      )
    }))
  }
}))