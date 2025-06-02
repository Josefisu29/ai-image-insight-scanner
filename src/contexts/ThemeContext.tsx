
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    card: string;
    border: string;
    gradientFrom: string;
    gradientTo: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'cosmic-dark',
    name: 'Cosmic Dark',
    description: 'Deep space vibes with purple and blue',
    colors: {
      background: 'from-slate-900 via-purple-900 to-slate-900',
      foreground: 'text-white',
      primary: 'from-blue-500 to-purple-500',
      secondary: 'from-purple-500 to-pink-500',
      accent: 'from-blue-400 via-purple-400 to-pink-400',
      card: 'bg-white/5 backdrop-blur-xl border-white/10',
      border: 'border-white/20',
      gradientFrom: 'from-blue-500/20',
      gradientTo: 'to-purple-500/20',
      success: 'from-green-500 to-emerald-500',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-pink-500',
    }
  },
  {
    id: 'aurora-light',
    name: 'Aurora Light',
    description: 'Clean and bright with aurora colors',
    colors: {
      background: 'from-blue-50 via-indigo-50 to-purple-50',
      foreground: 'text-gray-900',
      primary: 'from-indigo-600 to-purple-600',
      secondary: 'from-blue-600 to-indigo-600',
      accent: 'from-indigo-500 via-purple-500 to-pink-500',
      card: 'bg-white/80 backdrop-blur-xl border-gray-200/50',
      border: 'border-gray-300/50',
      gradientFrom: 'from-indigo-500/10',
      gradientTo: 'to-purple-500/10',
      success: 'from-emerald-600 to-green-600',
      warning: 'from-amber-500 to-orange-500',
      error: 'from-red-500 to-rose-500',
    }
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Cyberpunk vibes with electric colors',
    colors: {
      background: 'from-gray-900 via-cyan-900 to-gray-900',
      foreground: 'text-cyan-100',
      primary: 'from-cyan-500 to-blue-500',
      secondary: 'from-pink-500 to-purple-500',
      accent: 'from-cyan-400 via-blue-400 to-purple-400',
      card: 'bg-cyan-500/5 backdrop-blur-xl border-cyan-500/20',
      border: 'border-cyan-500/30',
      gradientFrom: 'from-cyan-500/20',
      gradientTo: 'to-blue-500/20',
      success: 'from-green-400 to-emerald-400',
      warning: 'from-yellow-400 to-amber-400',
      error: 'from-red-400 to-pink-400',
    }
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    description: 'Warm sunset colors with orange and pink',
    colors: {
      background: 'from-orange-900 via-red-900 to-pink-900',
      foreground: 'text-orange-50',
      primary: 'from-orange-500 to-red-500',
      secondary: 'from-red-500 to-pink-500',
      accent: 'from-orange-400 via-red-400 to-pink-400',
      card: 'bg-orange-500/5 backdrop-blur-xl border-orange-500/20',
      border: 'border-orange-500/30',
      gradientFrom: 'from-orange-500/20',
      gradientTo: 'to-red-500/20',
      success: 'from-emerald-500 to-green-500',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-rose-500',
    }
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Nature-inspired greens with gold accents',
    colors: {
      background: 'from-emerald-900 via-green-900 to-teal-900',
      foreground: 'text-emerald-50',
      primary: 'from-emerald-500 to-teal-500',
      secondary: 'from-green-500 to-emerald-500',
      accent: 'from-emerald-400 via-green-400 to-teal-400',
      card: 'bg-emerald-500/5 backdrop-blur-xl border-emerald-500/20',
      border: 'border-emerald-500/30',
      gradientFrom: 'from-emerald-500/20',
      gradientTo: 'to-teal-500/20',
      success: 'from-green-500 to-emerald-500',
      warning: 'from-yellow-500 to-amber-500',
      error: 'from-red-500 to-rose-500',
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // Default to cosmic dark

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
