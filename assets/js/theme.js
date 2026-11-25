// Loaded synchronously in <head> to avoid a flash of the wrong theme.
(() => {
  const d = document.documentElement;
  d.classList.add('js');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch { /* storage unavailable */ }
  d.dataset.theme = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
})();
