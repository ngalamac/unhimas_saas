import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UIProvider } from './context/UIContext';
import { KeyboardShortcutsHelp } from './components/UI/KeyboardShortcutsHelp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIProvider>
      <App />
      <KeyboardShortcutsHelp />
    </UIProvider>
  </StrictMode>
);
