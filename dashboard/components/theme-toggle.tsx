'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const changeEvent = 'invoice-theme-change';
const getTheme = () => document.documentElement.dataset.theme === 'dark';
const getServerTheme = () => false;

function subscribe(onChange: () => void) {
  // Keep open tabs in sync, including when a saved preference is removed.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
    onChange();
  };
  window.addEventListener(changeEvent, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  function toggleTheme() {
    const theme = getTheme() ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    // The current visit still works when storage is disabled or full.
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
    window.dispatchEvent(new Event(changeEvent));
  }

  return <button className="theme-toggle" type="button" role="switch" aria-label="Dark mode" aria-checked={dark} onClick={toggleTheme}>
    <span className="theme-light"><Sun size={17} aria-hidden="true"/>Light mode</span>
    <span className="theme-dark"><Moon size={17} aria-hidden="true"/>Dark mode</span>
  </button>;
}
