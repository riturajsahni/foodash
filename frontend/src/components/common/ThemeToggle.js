import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-200 active:scale-90
        ${isDark
          ? 'bg-gray-800 hover:bg-gray-700 text-amber-400'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
        ${className}`}
    >
      <div className="relative w-5 h-5">
        <Sun  className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
        <Moon className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </div>
    </button>
  );
}