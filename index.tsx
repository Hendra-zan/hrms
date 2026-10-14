
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ConfirmProvider } from './components/ConfirmDialog.tsx';

import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// Apply persisted UI theme (light/dark/system/indigo/emerald)
try {
    const stored = localStorage.getItem('ui_theme');
    const theme = stored || 'light';
    document.documentElement.classList.remove('theme-dark', 'theme-indigo', 'theme-emerald', 'theme-turquoise');
    if (theme === 'dark') {
        document.documentElement.classList.add('theme-dark');
    } else if (theme === 'indigo') {
        document.documentElement.classList.add('theme-indigo');
    } else if (theme === 'emerald') {
        document.documentElement.classList.add('theme-emerald');
    } else if (theme === 'turquoise') {
        document.documentElement.classList.add('theme-turquoise');
    } else if (theme === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.classList.add('theme-dark');
    }
} catch (err) {
    // ignore
}

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <ConfirmProvider>
                <App />
            </ConfirmProvider>
        </BrowserRouter>
    </React.StrictMode>
);