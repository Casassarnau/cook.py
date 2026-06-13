(function syncVisualViewport() {
  const root = document.documentElement;
  // Gaps below ~120px come from the top URL bar / scroll, not the keyboard.
  const KEYBOARD_INSET_THRESHOLD = 120;

  function update() {
    const vv = window.visualViewport;
    if (!vv) return;

    root.style.setProperty('--vvh', `${vv.height}px`);
    root.style.setProperty('--vv-top', `${vv.offsetTop}px`);

    const layoutHeight = window.innerHeight;
    const gapFromLayoutBottom = Math.max(0, layoutHeight - vv.offsetTop - vv.height);
    const bottomInset =
      gapFromLayoutBottom >= KEYBOARD_INSET_THRESHOLD ? gapFromLayoutBottom : 0;
    root.style.setProperty('--vv-bottom', `${bottomInset}px`);
  }

  update();

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => setTimeout(update, 150));
})();
