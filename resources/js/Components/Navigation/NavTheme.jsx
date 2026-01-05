import React, { useEffect, useState, useCallback } from 'react';
import { SunIcon, MoonIcon, ClockIcon } from '@heroicons/react/24/solid';
import { PaintBrushIcon } from '@heroicons/react/24/outline';

const themes = [
  { name: 'Orange', class: '', color: '249 115 22' }, // default
  { name: 'Olive', class: 'theme-olive', color: '195 207 33' },
  { name: 'Blue', class: 'theme-blue', color: '37 99 235' },
  { name: 'Purple', class: 'theme-purple', color: '139 92 246' },
  { name: 'Green', class: 'theme-green', color: '16 185 129' },
  { name: 'Pink', class: 'theme-pink', color: '236 72 153' },
];

// Check if current time is during "day" hours (6am - 8pm)
function isDayTime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20; // 6:00 AM to 7:59 PM is day
}

function getCurrentMode() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function NavTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || '');
  const [mode, setModeState] = useState(() => localStorage.getItem('mode') || 'light');
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('darkTheme') || '');
  const [autoMode, setAutoModeState] = useState(() => localStorage.getItem('autoMode') === 'true');

  // Apply mode to document
  const applyMode = useCallback((newMode) => {
    document.documentElement.classList.add('disable-transitions');
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  }, []);

  // Check and apply auto mode based on time
  const checkAutoMode = useCallback(() => {
    if (autoMode) {
      const shouldBeDark = !isDayTime();
      const currentMode = getCurrentMode();
      if ((shouldBeDark && currentMode !== 'dark') || (!shouldBeDark && currentMode !== 'light')) {
        const newMode = shouldBeDark ? 'dark' : 'light';
        applyMode(newMode);
        setModeState(newMode);
        localStorage.setItem('mode', newMode);
      }
    }
  }, [autoMode, applyMode]);

  // Set up interval to check time when auto mode is enabled
  useEffect(() => {
    if (autoMode) {
      checkAutoMode(); // Check immediately
      const interval = setInterval(checkAutoMode, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [autoMode, checkAutoMode]);

  function handleSetTheme(themeClass) {
    document.documentElement.classList.add('disable-transitions');

    document.body.classList.remove(...themes.map(t => t.class).filter(Boolean));
    if (themeClass) document.body.classList.add(themeClass);
    localStorage.setItem('theme', themeClass);
    setThemeState(themeClass);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  }

  function handleSetMode(newMode) {
    // Disable auto mode when manually setting mode
    if (autoMode) {
      setAutoModeState(false);
      localStorage.setItem('autoMode', 'false');
    }
    
    applyMode(newMode);
    localStorage.setItem('mode', newMode);
    setModeState(newMode);
  }

  function handleToggleAutoMode() {
    const newAutoMode = !autoMode;
    setAutoModeState(newAutoMode);
    localStorage.setItem('autoMode', String(newAutoMode));
    
    if (newAutoMode) {
      // Immediately apply the correct mode based on time
      const shouldBeDark = !isDayTime();
      const newMode = shouldBeDark ? 'dark' : 'light';
      applyMode(newMode);
      setModeState(newMode);
      localStorage.setItem('mode', newMode);
    }
  }

  function handleSetDarkTheme(darkThemeClass) {
    document.documentElement.classList.add('disable-transitions');

    if (darkThemeClass) document.body.classList.add(darkThemeClass);
    else document.body.classList.remove('theme-dark-slate');

    localStorage.setItem('darkTheme', darkThemeClass);
    setDarkTheme(darkThemeClass);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  }

  return (
    <div className="flex flex-col gap-2 divide-y divide-gray-200 dark:divide-dark-700"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full bg-theme-50 ring-theme-600/30 dark:bg-theme-100/75 ring-2">
          <PaintBrushIcon className="w-5 h-5 text-theme-700 dark:text-theme-800" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">Styling</span>
          <span className="text-sm text-gray-500 dark:text-dark-400">Customise your Pulse.</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="text-xs text-gray-500 dark:text-dark-400 flex-shrink-0">Theme:</span>
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
                    ? 'border-theme-500 ring-2 ring-theme-300 dark:border-theme-700/75 dark:ring-theme-600/75'
                    : 'border-gray-200 dark:border-dark-700'
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
        <span className="text-xs text-gray-500 dark:text-dark-400">Dark Mode:</span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            let isDragging = false;
            let dragDistance = 0;

            const thumb = e.currentTarget.querySelector('.thumb');

            const handleMouseMove = (moveEvent) => {
              dragDistance = moveEvent.clientY - e.clientY;

              if (mode === 'dark') {
                // Apply rubber band effect
                const clampedDistance = Math.max(-20, Math.min(20, dragDistance)); // Limit the drag distance
                thumb.style.transform = `translateX(28px) translateY(${clampedDistance}px) scale(${1 - Math.abs(clampedDistance) / 150})`;
              }

              if (Math.abs(dragDistance) > 5 && mode === 'dark') {
                isDragging = true; // Mark as dragging if any movement occurs
              }

              if (dragDistance > 50 && mode === 'dark') {
                // If dragged downward by more than 50px
                handleSetDarkTheme('theme-dark-slate'); // Change to 'darkest' theme
                document.removeEventListener('mousemove', handleMouseMove);
              } else if (dragDistance < -50 && mode === 'dark') {
                // If dragged upward by more than 50px
                handleSetDarkTheme(''); // Clear the darkTheme
                document.removeEventListener('mousemove', handleMouseMove);
              }
            };

            const handleMouseUp = () => {
              if (mode === 'dark') {
                thumb.style.transform = `translateX(28px) translateY(0px) scale(1)`; // Reset to default position
              }

              if (!isDragging) {
                // Perform normal toggle if not dragged
                handleSetMode(mode === 'dark' ? 'light' : 'dark');
              }

              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          className={`relative w-14 h-7 rounded-full bg-blue-200 dark:bg-gray-700 ring-2 ring-blue-500/50 overflow-clip  ${darkTheme === 'theme-dark-slate' ? "dark:bg-neutral-700 dark:ring-neutral-600/50" : "dark:bg-gray-700 dark:ring-gray-600/50"} flex items-center transition-colors duration-300 focus:outline-none`}
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
            <span className="absolute bottom-0 right-0 w-7 h-3 bg-white rounded-full opacity-90" />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full opacity-80" />
            <span className="absolute bottom-0.5 right-0 w-3 h-3 bg-white rounded-full opacity-70" />
            <span className="absolute bottom-0 right-6 w-2.5 h-2 bg-white rounded-full opacity-60" />
          </span>
          {/* Thumb with animated icons inside */}
          <span
            className={`allow-transitions thumb absolute left-0.5 top-0.5 w-6 h-6 rounded-full bg-blue-50 ${darkTheme === 'theme-dark-slate' ? "dark:bg-neutral-900" : "dark:bg-gray-900"} shadow transition-transform duration-300 flex items-center justify-center`}
            style={{
              transform: mode === 'dark' ? 'translateX(28px)' : 'translateX(0px)',
              transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
            }}
          >
            {/* Sun icon */}
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300 p-1 shadow-sm allow-transitions"
              style={{
                opacity: mode === 'dark' ? 0 : 1,
                transform: mode === 'dark'
                  ? 'translateX(-14px) rotate(-90deg)'
                  : 'translateX(0px) rotate(0deg)',
                transition: 'opacity 0.3s, transform 0.3s cubic-bezier(.4,0,.2,1)',
              }}
            >
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0 relative ring-yellow-300 ring-2"></div>
            </span>
            {/* Moon or Batman icon */}
            <span
              className="absolute inset-0 flex items-center justify-center transition-all duration-300 p-1 allow-transitions"
              style={{
                opacity: mode === 'dark' ? 1 : 0,
                transform: mode === 'dark'
                  ? 'translateX(0px) rotate(0deg)'
                  : 'translateX(14px) rotate(180deg)',
                transition: 'opacity 0.3s, transform 0.3s cubic-bezier(.4,0,.2,1)',
              }}
            >
              {darkTheme === 'theme-dark-slate' ? (
                <img src="/images/dark-mode.webp" alt="Batman" className="w-4 h-4 invert contrast-50" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-400" />
              )}
            </span>
          </span>
        </button>
        
        {/* Auto Mode Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggleAutoMode();
          }}
          className={`p-1.5 rounded-full transition-colors ${
            autoMode 
              ? 'bg-theme-100 dark:bg-theme-900/30' 
              : 'hover:bg-gray-100 dark:hover:bg-dark-700'
          }`}
          aria-label="Toggle auto dark mode based on time"
          // title={autoMode ? `Auto mode: ${isDayTime() ? 'Day (Light)' : 'Night (Dark)'}` : 'Enable auto dark mode'}
        >
          <ClockIcon className={`w-5 h-5 ${autoMode ? 'text-theme-600 dark:text-theme-400' : 'text-gray-400 dark:text-dark-500'}`} />
        </button>
      </div>
    </div>
  );
}