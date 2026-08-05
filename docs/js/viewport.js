/**
 * Keep the layout viewport stable when the virtual keyboard opens so
 * position:fixed bottom UI does not jump. interactive-widget=overlays-content
 * in the viewport meta covers Chrome; VirtualKeyboard API reinforces it.
 */
(function stabilizeMobileViewport() {
  try {
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }
  } catch {
    // API may be present but reject writes in some WebViews.
  }
})();
