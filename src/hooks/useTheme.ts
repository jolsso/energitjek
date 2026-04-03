import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(theme === 'system' ? mediaQuery.matches : theme === 'dark')

    if (theme !== 'system') return

    const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  }

  return { theme, toggleTheme }
}
