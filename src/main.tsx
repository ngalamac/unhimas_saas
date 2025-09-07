import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UIProvider } from './context/UIContext';
import { ThemeProvider } from './context/ThemeContext';
import { TranslationProvider } from './context/TranslationContext';
import { KeyboardShortcutsHelp } from './components/UI/KeyboardShortcutsHelp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TranslationProvider>
        <UIProvider>
          <App />
          <KeyboardShortcutsHelp />
        </UIProvider>
      </TranslationProvider>
    </ThemeProvider>
  </StrictMode>
);
