import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@/lib/theme';
import './index.css';
import './styles/design.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="th-platform-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
