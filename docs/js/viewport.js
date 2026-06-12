(function syncVisualViewport() {
  const root = document.documentElement;

  function update() {
    const vv = window.visualViewport;
    if (!vv) return;

    root.style.setProperty('--vvh', `${vv.height}px`);
    root.style.setProperty('--vv-top', `${vv.offsetTop}px`);

    const layoutHeight = root.clientHeight;
    const bottom = Math.max(0, layoutHeight - vv.offsetTop - vv.height);
    root.style.setProperty('--vv-bottom', `${bottom}px`);
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
