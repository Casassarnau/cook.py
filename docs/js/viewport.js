/**
 * Chromium: interactive-widget=overlays-content + VirtualKeyboard API keep
 * the layout viewport stable, so position:fixed bottom UI does not jump.
 *
 * Firefox Android (no VirtualKeyboard API) still shifts the visual viewport
 * when the dynamic toolbar or keyboard shows. Pin overlays/docks to
 * visualViewport so they stay glued to the visible screen edge.
 */
(function stabilizeMobileViewport() {
  try {
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }
  } catch {
    // API may be present but reject writes in some WebViews.
  }

  const vv = window.visualViewport;
  const needsVisualViewportPin =
    vv &&
    /Android/i.test(navigator.userAgent) &&
    !('virtualKeyboard' in navigator);

  if (!needsVisualViewportPin) return;

  const root = document.documentElement;
  root.classList.add('vv-pin');

  function update() {
    const top = vv.offsetTop;
    const height = vv.height;
    const bottom = Math.max(0, window.innerHeight - top - height);

    root.style.setProperty('--vv-top', `${top}px`);
    root.style.setProperty('--vvh', `${height}px`);
    root.style.setProperty('--vv-bottom', `${bottom}px`);
  }

  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => setTimeout(update, 150));
})();
