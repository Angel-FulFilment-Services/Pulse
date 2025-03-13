import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ActiveStateProvider } from './Components/context/ActiveStateContext';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

import NavBar from './Components/Navigation/NavBar.jsx';

import Background from './Components/Branding/Background.jsx';
import Hero from './Components/Branding/Hero.jsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    let page = pages[`./Pages/${name}.jsx`];

    switch (true) {
      case name.startsWith('Authentication/'):
        page.default.layout = (page) => (
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
        );
        break;
      default:
        page.default.layout = (page) => (
          <ActiveStateProvider>
            <NavBar page={page} />
          </ActiveStateProvider>
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