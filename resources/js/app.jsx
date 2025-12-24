import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ActiveStateProvider } from './Components/Context/ActiveStateContext';
import { NotificationProvider } from './Components/Context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initialize Laravel Echo for WebSocket
import './echo-reverb';

import NavBar from './Components/Navigation/NavBar.jsx';
import Background from './Components/Branding/Background.jsx';
import Hero from './Components/Branding/Hero.jsx';

const themes = [
  { name: 'Orange', class: '', color: '249 115 22' }, // default
  { name: 'Olive', class: 'theme-olive', color: '195 207 33' },
  { name: 'Blue', class: 'theme-blue', color: '37 99 235' },
  { name: 'Purple', class: 'theme-purple', color: '139 92 246' },
  { name: 'Green', class: 'theme-green', color: '16 185 129' },
  { name: 'Pink', class: 'theme-pink', color: '236 72 153' },
];

function AppWrapper({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || '');
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('darkTheme') || '');
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');

  useEffect(() => {
    // Apply theme from localStorage
    document.body.classList.remove(...themes.map((t) => t.class).filter(Boolean));
    if (theme) document.body.classList.add(theme);

    // document.body.classList.remove(darkTheme).filter(Boolean);
    if (darkTheme) document.body.classList.add(darkTheme);
    else document.body.classList.remove('theme-dark-slate');

    // Apply mode from localStorage
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mode, darkTheme]);

  const handleSetTheme = (themeClass) => {
    document.documentElement.classList.add('disable-transitions');
    
    document.body.classList.remove(...themes.map((t) => t.class).filter(Boolean));
    if (themeClass) document.body.classList.add(themeClass);
    localStorage.setItem('theme', themeClass);
    setTheme(themeClass);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  };

  const handleSetMode = (newMode) => {
    document.documentElement.classList.add('disable-transitions');

    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mode', newMode);
    setMode(newMode);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  };

  const handleSetDarkTheme = (darkThemeClass) => {
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
    <div>
      {children({
        theme,
        mode,
        handleSetTheme,
        handleSetMode,
        handleSetDarkTheme,
      })}
    </div>
  );
}

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    let page = pages[`./Pages/${name}.jsx`];

    switch (true) {
      case name.startsWith('Authentication/'):
        page.default.layout = (page) => (
          <AppWrapper>
            {() => (
              <div
                style={{
                  background:
                    'linear-gradient(315deg, rgba(68,103,144,1) 0%, rgba(110,152,192,1) 60%, rgba(194,243,240,1) 100%)',
                }}
              >
                <ToastContainer />
                <Background />
                <Hero />
                <div children={page} />
              </div>
            )}
          </AppWrapper>
        );
        break;
      case name.startsWith('Chat/ChatPopout'):
        page.default.layout = (page) => (
          <AppWrapper>
            {({ theme, mode, handleSetTheme, handleSetMode }) => (
              <ActiveStateProvider>
                <NotificationProvider>
                  <ToastContainer />
                  <div children={page} />
                </NotificationProvider>
              </ActiveStateProvider>
            )}
          </AppWrapper>
        );
        break;
      case name.startsWith('Site/'):
        page.default.layout = (page) => (
          <AppWrapper>
            {() => (
              <div
                style={{
                  background:
                    'linear-gradient(315deg, rgba(0,141,169,1) 0%, rgba(20,110,130,1) 60%, rgba(30,70,90,1) 100%)',
                }}
                className="theme-olive"
              >
                {!name.startsWith('Site/Widget') && !name.startsWith('Site/RollCall') && (
                  <>
                    <ToastContainer />
                    <Background />
                    <Hero />
                  </>
                )}
                <div children={page} />
              </div>
            )}
          </AppWrapper>
        );
        break;
      case name.startsWith('Dashboard/Wallboard'):
        page.default.layout = (page) => (
          <AppWrapper>
            {() => (
              <div className="min-h-dvh bg-black text-white">
                <div children={page} />
              </div>
            )}
          </AppWrapper>
        );
        break;
      case name.startsWith('Account/MobileProfilePhoto'):
        page.default.layout = (page) => (
          <AppWrapper>
            {() => (
              <div children={page} />
            )}
          </AppWrapper>
        );
        break;
      default:
        page.default.layout = (page) => (
          <AppWrapper>
            {({ theme, mode, handleSetTheme, handleSetMode }) => (
              <ActiveStateProvider>
                <NotificationProvider>
                  <ToastContainer />
                  <NavBar
                    page={page}
                    theme={theme}
                    mode={mode}
                  handleSetTheme={handleSetTheme}
                  handleSetMode={handleSetMode}
                />
                </NotificationProvider>
              </ActiveStateProvider>
            )}
          </AppWrapper>
        );
        break;
    }

    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <Router>
        <App {...props} />
      </Router>
    );
  },
});