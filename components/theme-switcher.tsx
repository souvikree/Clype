'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react'
import { useThemeStore, themes, ThemeId } from '@/lib/theme-store'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme, soundEnabled, reducedMotion, setTheme, toggleSound, toggleMotion } = useThemeStore()

  const themeList = Object.values(themes)

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 cyber-button relative overflow-hidden"
      >
        <Palette size={18} className="glow" />
        <span className="font-mono text-xs">{themes[currentTheme].name}</span>
      </Button>

      {/* Theme Picker Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed top-20 right-4 z-50 w-80 glass border border-primary/30 rounded-lg p-4 shadow-2xl"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold font-mono text-lg glow neon-text">
                    THEME SELECT
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {themeList.map((theme) => (
                    <motion.button
                      key={theme.id}
                      onClick={() => {
                        setTheme(theme.id as ThemeId)
                        setTimeout(() => setIsOpen(false), 300)
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative p-3 rounded border-2 transition-all text-left
                        ${currentTheme === theme.id
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-border bg-card hover:border-primary/50'
                        }
                      `}
                    >
                      {/* Theme Preview */}
                      <div className="flex gap-1 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: theme.colors.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: theme.colors.secondary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: theme.colors.accent }}
                        />
                      </div>

                      {/* Theme Name */}
                      <div className="font-mono font-bold text-xs mb-1">
                        {theme.name}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {theme.description}
                      </div>

                      {/* Active Indicator */}
                      {currentTheme === theme.id && (
                        <motion.div
                          layoutId="activeTheme"
                          className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
                          style={{
                            boxShadow: `0 0 10px ${theme.colors.primary}`,
                          }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Settings */}
                <div className="border-t border-border pt-3 space-y-2">
                  <button
                    onClick={toggleSound}
                    className="flex items-center justify-between w-full p-2 rounded hover:bg-muted/50 transition"
                  >
                    <span className="font-mono text-sm flex items-center gap-2">
                      {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      Sound Effects
                    </span>
                    <div
                      className={`w-10 h-5 rounded-full transition-colors ${
                        soundEnabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <motion.div
                        animate={{ x: soundEnabled ? 20 : 0 }}
                        className="w-5 h-5 bg-white rounded-full shadow"
                      />
                    </div>
                  </button>

                  <button
                    onClick={toggleMotion}
                    className="flex items-center justify-between w-full p-2 rounded hover:bg-muted/50 transition"
                  >
                    <span className="font-mono text-sm flex items-center gap-2">
                      {reducedMotion ? <ZapOff size={16} /> : <Zap size={16} />}
                      Animations
                    </span>
                    <div
                      className={`w-10 h-5 rounded-full transition-colors ${
                        !reducedMotion ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <motion.div
                        animate={{ x: !reducedMotion ? 20 : 0 }}
                        className="w-5 h-5 bg-white rounded-full shadow"
                      />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}