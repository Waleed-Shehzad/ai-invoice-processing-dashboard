export const THEME_STORAGE_KEY = 'invoice-dashboard-theme';

// Runs synchronously in <head>, before the browser paints dashboard content.
// Only an explicit saved choice enables dark mode; first visits stay light.
export const themeInitScript = `(() => {
  let theme = 'light';
  try {
    if (localStorage.getItem('${THEME_STORAGE_KEY}') === 'dark') theme = 'dark';
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
