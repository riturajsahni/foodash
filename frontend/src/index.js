import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import { I18nProvider } from './utils/i18n';

import { ThemeProvider } from './contexts/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider>
    <I18nProvider>
        <App />
    </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);