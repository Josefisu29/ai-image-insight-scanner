
import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSwitcher = () => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gradient-to-r ${currentTheme.colors.primary} hover:opacity-90 text-white transition-all duration-300`}
        size="sm"
      >
        <Palette className="w-4 h-4 mr-2" />
        Themes
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <Card className={`${currentTheme.colors.card} shadow-2xl min-w-[300px]`}>
            <CardContent className="p-4">
              <h3 className={`font-semibold mb-4 ${currentTheme.colors.foreground}`}>
                Choose Theme
              </h3>
              <div className="space-y-3">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${
                      currentTheme.id === theme.id 
                        ? `bg-gradient-to-r ${theme.colors.primary} text-white` 
                        : `${currentTheme.colors.card} hover:bg-white/10`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${currentTheme.id === theme.id ? 'text-white' : currentTheme.colors.foreground}`}>
                          {theme.name}
                        </div>
                        <div className={`text-sm ${currentTheme.id === theme.id ? 'text-white/80' : 'text-gray-400'}`}>
                          {theme.description}
                        </div>
                      </div>
                      {currentTheme.id === theme.id && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.colors.primary}`}></div>
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.colors.secondary}`}></div>
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.colors.success}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
