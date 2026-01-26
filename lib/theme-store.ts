import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 
  | 'cyberpunk' 
  | 'matrix' 
  | 'neon' 
  | 'hacker-green' 
  | 'dark' 
  | 'light'
  | 'dracula'
  | 'solarized'
  | 'retro-terminal'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    muted: string
    mutedForeground: string
    border: string
    input: string
    ring: string
  }
  effects: {
    glassEffect: boolean
    scanlines: boolean
    glow: boolean
    pixelated: boolean
    blur: boolean
  }
  fonts: {
    display: string
    mono: string
  }
}

export const themes: Record<ThemeId, Theme> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'Neon-soaked streets of Night City',
    colors: {
      background: 'oklch(0.08 0.02 285)',
      foreground: 'oklch(0.98 0 0)',
      card: 'oklch(0.12 0.03 285)',
      cardForeground: 'oklch(0.98 0 0)',
      primary: 'oklch(0.75 0.25 330)', // Hot pink/magenta
      primaryForeground: 'oklch(0.12 0 0)',
      secondary: 'oklch(0.70 0.22 195)', // Cyan
      secondaryForeground: 'oklch(0.98 0 0)',
      accent: 'oklch(0.78 0.24 85)', // Yellow/gold
      accentForeground: 'oklch(0.12 0 0)',
      destructive: 'oklch(0.65 0.25 25)',
      destructiveForeground: 'oklch(0.98 0 0)',
      muted: 'oklch(0.25 0.02 285)',
      mutedForeground: 'oklch(0.60 0 0)',
      border: 'oklch(0.30 0.08 330)',
      input: 'oklch(0.15 0.03 285)',
      ring: 'oklch(0.75 0.25 330)',
    },
    effects: {
      glassEffect: true,
      scanlines: true,
      glow: true,
      pixelated: false,
      blur: true,
    },
    fonts: {
      display: 'Orbitron, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
  matrix: {
    id: 'matrix',
    name: 'The Matrix',
    description: 'Follow the white rabbit',
    colors: {
      background: 'oklch(0.05 0 0)',
      foreground: 'oklch(0.85 0.15 145)', // Matrix green
      card: 'oklch(0.08 0 0)',
      cardForeground: 'oklch(0.85 0.15 145)',
      primary: 'oklch(0.75 0.20 145)',
      primaryForeground: 'oklch(0.05 0 0)',
      secondary: 'oklch(0.65 0.15 145)',
      secondaryForeground: 'oklch(0.05 0 0)',
      accent: 'oklch(0.80 0.22 145)',
      accentForeground: 'oklch(0.05 0 0)',
      destructive: 'oklch(0.70 0.18 145)',
      destructiveForeground: 'oklch(0.05 0 0)',
      muted: 'oklch(0.20 0.08 145)',
      mutedForeground: 'oklch(0.55 0.12 145)',
      border: 'oklch(0.35 0.12 145)',
      input: 'oklch(0.10 0 0)',
      ring: 'oklch(0.75 0.20 145)',
    },
    effects: {
      glassEffect: false,
      scanlines: true,
      glow: true,
      pixelated: false,
      blur: false,
    },
    fonts: {
      display: 'Share Tech Mono, monospace',
      mono: 'Courier Prime, monospace',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Electric dreams in synthwave',
    colors: {
      background: 'oklch(0.10 0.02 270)',
      foreground: 'oklch(0.95 0 0)',
      card: 'oklch(0.14 0.03 270)',
      cardForeground: 'oklch(0.95 0 0)',
      primary: 'oklch(0.72 0.26 300)', // Purple
      primaryForeground: 'oklch(0.98 0 0)',
      secondary: 'oklch(0.75 0.24 330)', // Pink
      secondaryForeground: 'oklch(0.98 0 0)',
      accent: 'oklch(0.78 0.25 180)', // Cyan
      accentForeground: 'oklch(0.12 0 0)',
      destructive: 'oklch(0.68 0.24 15)',
      destructiveForeground: 'oklch(0.98 0 0)',
      muted: 'oklch(0.28 0.04 270)',
      mutedForeground: 'oklch(0.65 0 0)',
      border: 'oklch(0.35 0.12 300)',
      input: 'oklch(0.16 0.03 270)',
      ring: 'oklch(0.72 0.26 300)',
    },
    effects: {
      glassEffect: true,
      scanlines: false,
      glow: true,
      pixelated: false,
      blur: true,
    },
    fonts: {
      display: 'Audiowide, sans-serif',
      mono: 'Fira Code, monospace',
    },
  },
  'hacker-green': {
    id: 'hacker-green',
    name: 'Hacker Terminal',
    description: 'Old-school hacking aesthetic',
    colors: {
      background: 'oklch(0.06 0 0)',
      foreground: 'oklch(0.82 0.14 150)',
      card: 'oklch(0.09 0 0)',
      cardForeground: 'oklch(0.82 0.14 150)',
      primary: 'oklch(0.70 0.18 150)',
      primaryForeground: 'oklch(0.06 0 0)',
      secondary: 'oklch(0.60 0.16 150)',
      secondaryForeground: 'oklch(0.06 0 0)',
      accent: 'oklch(0.75 0.20 150)',
      accentForeground: 'oklch(0.06 0 0)',
      destructive: 'oklch(0.68 0.18 150)',
      destructiveForeground: 'oklch(0.06 0 0)',
      muted: 'oklch(0.22 0.08 150)',
      mutedForeground: 'oklch(0.50 0.12 150)',
      border: 'oklch(0.30 0.12 150)',
      input: 'oklch(0.08 0 0)',
      ring: 'oklch(0.70 0.18 150)',
    },
    effects: {
      glassEffect: false,
      scanlines: true,
      glow: true,
      pixelated: true,
      blur: false,
    },
    fonts: {
      display: 'VT323, monospace',
      mono: 'IBM Plex Mono, monospace',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Classic dark theme',
    colors: {
      background: 'oklch(0.08 0 0)',
      foreground: 'oklch(0.95 0 0)',
      card: 'oklch(0.12 0 0)',
      cardForeground: 'oklch(0.95 0 0)',
      primary: 'oklch(0.6 0.2 310)',
      primaryForeground: 'oklch(0.12 0 0)',
      secondary: 'oklch(0.5 0.2 280)',
      secondaryForeground: 'oklch(0.95 0 0)',
      accent: 'oklch(0.6 0.25 185)',
      accentForeground: 'oklch(0.12 0 0)',
      destructive: 'oklch(0.65 0.2 25)',
      destructiveForeground: 'oklch(0.95 0 0)',
      muted: 'oklch(0.35 0 0)',
      mutedForeground: 'oklch(0.65 0 0)',
      border: 'oklch(0.25 0 0)',
      input: 'oklch(0.15 0 0)',
      ring: 'oklch(0.6 0.2 310)',
    },
    effects: {
      glassEffect: false,
      scanlines: false,
      glow: false,
      pixelated: false,
      blur: false,
    },
    fonts: {
      display: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    description: 'Clean and bright',
    colors: {
      background: 'oklch(0.98 0 0)',
      foreground: 'oklch(0.12 0 0)',
      card: 'oklch(1.0 0 0)',
      cardForeground: 'oklch(0.12 0 0)',
      primary: 'oklch(0.45 0.2 270)',
      primaryForeground: 'oklch(0.98 0 0)',
      secondary: 'oklch(0.50 0.15 240)',
      secondaryForeground: 'oklch(0.98 0 0)',
      accent: 'oklch(0.55 0.20 200)',
      accentForeground: 'oklch(0.98 0 0)',
      destructive: 'oklch(0.55 0.22 25)',
      destructiveForeground: 'oklch(0.98 0 0)',
      muted: 'oklch(0.92 0 0)',
      mutedForeground: 'oklch(0.45 0 0)',
      border: 'oklch(0.88 0 0)',
      input: 'oklch(0.95 0 0)',
      ring: 'oklch(0.45 0.2 270)',
    },
    effects: {
      glassEffect: false,
      scanlines: false,
      glow: false,
      pixelated: false,
      blur: false,
    },
    fonts: {
      display: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    description: 'Elegant vampire aesthetic',
    colors: {
      background: 'oklch(0.18 0.02 285)',
      foreground: 'oklch(0.92 0 0)',
      card: 'oklch(0.22 0.02 285)',
      cardForeground: 'oklch(0.92 0 0)',
      primary: 'oklch(0.72 0.18 320)', // Purple
      primaryForeground: 'oklch(0.18 0 0)',
      secondary: 'oklch(0.68 0.16 195)', // Cyan
      secondaryForeground: 'oklch(0.18 0 0)',
      accent: 'oklch(0.75 0.18 140)', // Green
      accentForeground: 'oklch(0.18 0 0)',
      destructive: 'oklch(0.65 0.20 15)',
      destructiveForeground: 'oklch(0.92 0 0)',
      muted: 'oklch(0.30 0.02 285)',
      mutedForeground: 'oklch(0.62 0 0)',
      border: 'oklch(0.32 0.04 320)',
      input: 'oklch(0.20 0.02 285)',
      ring: 'oklch(0.72 0.18 320)',
    },
    effects: {
      glassEffect: true,
      scanlines: false,
      glow: true,
      pixelated: false,
      blur: false,
    },
    fonts: {
      display: 'Space Grotesk, sans-serif',
      mono: 'Fira Code, monospace',
    },
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized Dark',
    description: 'Precision colors for terminals',
    colors: {
      background: 'oklch(0.15 0.02 195)',
      foreground: 'oklch(0.82 0.01 60)',
      card: 'oklch(0.18 0.02 195)',
      cardForeground: 'oklch(0.82 0.01 60)',
      primary: 'oklch(0.58 0.18 255)', // Blue
      primaryForeground: 'oklch(0.15 0 0)',
      secondary: 'oklch(0.62 0.16 180)', // Cyan
      secondaryForeground: 'oklch(0.15 0 0)',
      accent: 'oklch(0.68 0.14 85)', // Yellow
      accentForeground: 'oklch(0.15 0 0)',
      destructive: 'oklch(0.55 0.20 40)',
      destructiveForeground: 'oklch(0.82 0 0)',
      muted: 'oklch(0.25 0.02 195)',
      mutedForeground: 'oklch(0.60 0.01 60)',
      border: 'oklch(0.28 0.04 195)',
      input: 'oklch(0.17 0.02 195)',
      ring: 'oklch(0.58 0.18 255)',
    },
    effects: {
      glassEffect: false,
      scanlines: false,
      glow: false,
      pixelated: false,
      blur: false,
    },
    fonts: {
      display: 'Source Code Pro, monospace',
      mono: 'Source Code Pro, monospace',
    },
  },
  'retro-terminal': {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    description: 'Amber phosphor CRT vibes',
    colors: {
      background: 'oklch(0.08 0 0)',
      foreground: 'oklch(0.75 0.14 75)', // Amber
      card: 'oklch(0.10 0 0)',
      cardForeground: 'oklch(0.75 0.14 75)',
      primary: 'oklch(0.72 0.16 75)',
      primaryForeground: 'oklch(0.08 0 0)',
      secondary: 'oklch(0.65 0.14 75)',
      secondaryForeground: 'oklch(0.08 0 0)',
      accent: 'oklch(0.78 0.18 75)',
      accentForeground: 'oklch(0.08 0 0)',
      destructive: 'oklch(0.70 0.16 75)',
      destructiveForeground: 'oklch(0.08 0 0)',
      muted: 'oklch(0.22 0.08 75)',
      mutedForeground: 'oklch(0.52 0.12 75)',
      border: 'oklch(0.32 0.12 75)',
      input: 'oklch(0.10 0 0)',
      ring: 'oklch(0.72 0.16 75)',
    },
    effects: {
      glassEffect: false,
      scanlines: true,
      glow: true,
      pixelated: true,
      blur: false,
    },
    fonts: {
      display: 'VT323, monospace',
      mono: 'VT323, monospace',
    },
  },
}

interface ThemeState {
  currentTheme: ThemeId
  soundEnabled: boolean
  reducedMotion: boolean
  setTheme: (themeId: ThemeId) => void
  toggleSound: () => void
  toggleMotion: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'cyberpunk',
      soundEnabled: true,
      reducedMotion: false,
      setTheme: (themeId) => set({ currentTheme: themeId }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
    }),
    {
      name: 'clype-theme-storage',
    }
  )
)