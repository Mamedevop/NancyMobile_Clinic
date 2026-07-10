import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  light:   { label: 'Light',   icon: '☀️',  bg: '#f5f7fb', surface: '#ffffff', text: '#1a1a2e', gray: '#6c757d', primary: '#4361ee', border: '#e5e7eb', sidebar: '#ffffff', topbar: '#ffffff' },
  dark:    { label: 'Dark',    icon: '🌙',  bg: '#0f0f1a', surface: '#1a1a2e', text: '#e8eaf6', gray: '#9ca3af', primary: '#7c3aed', border: '#2d2d44', sidebar: '#1a1a2e', topbar: '#1a1a2e' },
  diamond: { label: 'Diamond', icon: '💎',  bg: '#e8f4fd', surface: '#ffffff', text: '#0c2461', gray: '#5a7fa8', primary: '#1e90ff', border: '#b3d4f0', sidebar: '#dbeeff', topbar: '#ffffff' },
  gold:    { label: 'Gold',    icon: '🥇',  bg: '#fdf6e3', surface: '#fffdf5', text: '#3d2b00', gray: '#8a7040', primary: '#c9960c', border: '#e8d5a3', sidebar: '#fff8e1', topbar: '#fffdf5' },
}

const ThemeContext = createContext({})
export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  const switchTheme = (t) => {
    setTheme(t)
    localStorage.setItem('theme', t)
  }

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const t = THEMES[theme] || THEMES.light
    const root = document.documentElement
    root.style.setProperty('--bg', t.bg)
    root.style.setProperty('--surface', t.surface)
    root.style.setProperty('--text', t.text)
    root.style.setProperty('--gray', t.gray)
    root.style.setProperty('--primary', t.primary)
    root.style.setProperty('--border', t.border)
    root.style.setProperty('--sidebar-bg', t.sidebar)
    root.style.setProperty('--topbar-bg', t.topbar)
    root.style.setProperty('--dark', t.text)
    document.body.style.background = t.bg
    document.body.style.color = t.text
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
