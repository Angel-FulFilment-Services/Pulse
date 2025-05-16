import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { PaintBrushIcon } from '@heroicons/react/24/outline';

const themes = [
  { name: 'Orange', class: '', color: '249 115 22' }, // default
  { name: 'Olive', class: 'theme-olive', color: '195 207 33' },
  { name: 'Blue', class: 'theme-blue', color: '37 99 235' },
  { name: 'Purple', class: 'theme-purple', color: '139 92 246' },
  { name: 'Green', class: 'theme-green', color: '16 185 129' },
  { name: 'Cyan', class: 'theme-cyan', color: '22 163 74' },
];

function getCurrentMode() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function NavTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || '');
  const [mode, setModeState] = useState(() => localStorage.getItem('mode') || 'light');

  useEffect(() => {
    // Apply theme from localStorage
    document.body.classList.remove(...themes.map(t => t.class).filter(Boolean));
    if (theme) document.body.classList.add(theme);

    // Apply mode from localStorage
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mode]);

  function handleSetTheme(themeClass) {
    document.body.classList.remove(...themes.map(t => t.class).filter(Boolean));
    if (themeClass) document.body.classList.add(themeClass);
    localStorage.setItem('theme', themeClass);
    setThemeState(themeClass);
  }

  function handleSetMode(newMode) {
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mode', newMode);
    setModeState(newMode);
  }

  return (
    <div className="flex flex-col gap-2 divide-y divide-gray-200"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full bg-theme-50 ring-theme-600/30 ring-2">
          <PaintBrushIcon className="w-5 h-5 text-theme-700" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-sm font-semibold text-gray-700 ">Styling</span>
          <span className="text-sm text-gray-500">Customise your Pulse.</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="text-xs text-gray-500 flex-shrink-0">Theme:</span>
        <div className="flex flex-wrap gap-2">
          {themes.map((themeObj) => {
            const isActive = theme === themeObj.class;
            return (
              <button
                key={themeObj.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSetTheme(themeObj.class);
                }}
                className={`relative w-8 h-8 rounded-full border-2 hover:scale-95 flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'border-theme-500 ring-2 ring-theme-300'
                    : 'border-gray-200'
                }`}
                aria-label={themeObj.name}
                style={{ overflow: 'hidden' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  className="absolute inset-0"
                >
                  <defs>
                    <linearGradient
                      id={`diag-${themeObj.name}`}
                      x1="0"
                      y1="32"
                      x2="32"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop
                        offset="0.49"
                        stopColor={mode === 'dark' ? '#222' : '#fff'}
                      />
                      <stop offset="0.51" stopColor={`rgb(${themeObj.color})`} />
                    </linearGradient>
                  </defs>
                  <rect
                    x="0"
                    y="0"
                    width="32"
                    height="32"
                    fill={`url(#diag-${themeObj.name})`}
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-gray-500">Dark Mode:</span>
        <button
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleSetMode(mode === 'dark' ? 'light' : 'dark');
            }}
            className="relative w-14 h-7 rounded-full bg-blue-200 dark:bg-gray-700 ring-2 ring-blue-500/50 overflow-clip dark:ring-gray-600/50 flex items-center transition-colors duration-300 focus:outline-none"
            aria-label="Toggle dark mode"
        >
            {/* Stars for dark mode */}
            <span className="pointer-events-none absolute inset-0 z-0 hidden dark:block">
                <span className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-pulse" />
                <span className="absolute top-3 left-6 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" />
                <span className="absolute top-1 right-9 w-0.5 h-0.5 bg-white rounded-full opacity-70 animate-pulse" />
                <span className="absolute bottom-1.5 left-5 w-0.5 h-0.5 bg-white rounded-full opacity-70" />
                <span className="absolute bottom-2 right-11 w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-pulse" />
                <span className="absolute top-1 right-2 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-pulse" />
                <span className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-pulse" />
            </span>
            {/* Clouds for light mode */}
            <span className="pointer-events-none absolute inset-0 z-0 flex items-start justify-center dark:hidden">
                {/* Main cloud body */}
                <span className="absolute bottom-0 right-0 w-7 h-3 bg-white rounded-full opacity-90" />
                {/* Cloud puffs */}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full opacity-80" />
                <span className="absolute bottom-0.5 right-0 w-3 h-3 bg-white rounded-full opacity-70" />
                <span className="absolute bottom-0 right-6 w-2.5 h-2 bg-white rounded-full opacity-60" />
            </span>
            {/* Thumb with animated icons inside */}
            <span
                className="absolute left-0.5 top-0.5 w-6 h-6 rounded-full bg-blue-50 dark:bg-gray-900 shadow transition-transform duration-300 flex items-center justify-center"
                style={{
                    transform: mode === 'dark' ? 'translateX(28px)' : 'translateX(0px)',
                    transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)'
                }}
            >
                {/* Sun icon */}
                <span
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300 p-1 shadow-sm"
                    style={{
                        opacity: mode === 'dark' ? 0 : 1,
                        transform: mode === 'dark'
                            ? 'translateX(-14px) rotate(-90deg)'
                            : 'translateX(0px) rotate(0deg)',
                        transition: 'opacity 0.3s, transform 0.3s cubic-bezier(.4,0,.2,1)'
                    }}
                >
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0 relative ring-yellow-300 ring-2"></div>
                </span>
                {/* Moon icon */}
                <span
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300 p-1"
                    style={{
                        opacity: mode === 'dark' ? 1 : 0,
                        transform: mode === 'dark'
                            ? 'translateX(0px) rotate(0deg)'
                            : 'translateX(14px) rotate(180deg)',
                        transition: 'opacity 0.3s, transform 0.3s cubic-bezier(.4,0,.2,1)'
                    }}
                >
                    <MoonIcon className="w-5 h-5 text-gray-400" />
                </span>
            </span>
        </button>
        </div>
    </div>
  );
}