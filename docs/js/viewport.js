/**
 * Chromium: interactive-widget=overlays-content + VirtualKeyboard API keep
 * the layout viewport stable, so position:fixed bottom UI does not jump.
 *
 * Firefox Android (no VirtualKeyboard API) still shifts the visual viewport
 * when the dynamic toolbar or keyboard shows. Pin overlays/docks to
 * visualViewport so they stay glued to the visible screen edge.
 *
 * visualViewport fires many intermediate sizes while the toolbar animates;
 * only commit after it settles and snap toolbar insets to stable endpoints
 * so the dock does not flicker.
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

  const SETTLE_MS = 100;
  const TOOLBAR_INSET_MAX = 120;
  const EPSILON = 0.5;

  let settleTimer = null;
  let maxToolbarInset = 0;
  let minHeight = Infinity;
  let maxHeight = 0;
  let applied = {
    top: NaN,
    height: NaN,
    bottom: NaN
  };

  function readRaw() {
    const top = vv.offsetTop;
    const height = vv.height;
    const bottom = Math.max(0, window.innerHeight - top - height);
    return {
      top,
      height,
      bottom
    };
  }

  function snap(raw) {
    let {
      top,
      height,
      bottom
    } = raw;

    if (height < minHeight) minHeight = height;
    if (height > maxHeight) maxHeight = height;
    if (bottom > maxToolbarInset && bottom <= TOOLBAR_INSET_MAX) {
      maxToolbarInset = bottom;
    }

    const heightSpan = maxHeight - minHeight;
    if (heightSpan >= 24) {
      const useLarge = height >= minHeight + heightSpan * 0.5;
      height = useLarge ? maxHeight : minHeight;
      if (useLarge) top = 0;
    }

    if (bottom > TOOLBAR_INSET_MAX) {
      // Keyboard — keep the settled live inset.
    } else if (maxToolbarInset >= 16) {
      bottom = bottom >= maxToolbarInset * 0.5 ? maxToolbarInset : 0;
    } else {
      bottom = bottom < EPSILON ? 0 : bottom;
    }

    return {
      top,
      height,
      bottom
    };
  }

  function apply(next) {
    if (
      Math.abs(applied.top - next.top) < EPSILON &&
      Math.abs(applied.height - next.height) < EPSILON &&
      Math.abs(applied.bottom - next.bottom) < EPSILON
    ) {
      return;
    }

    applied = next;
    root.style.setProperty('--vv-top', `${next.top}px`);
    root.style.setProperty('--vvh', `${next.height}px`);
    root.style.setProperty('--vv-bottom', `${next.bottom}px`);
  }

  function commit() {
    apply(snap(readRaw()));
  }

  function scheduleCommit() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = null;
      commit();
    }, SETTLE_MS);
  }

  function resetSpanAndCommit() {
    maxToolbarInset = 0;
    minHeight = Infinity;
    maxHeight = 0;
    clearTimeout(settleTimer);
    settleTimer = null;
    commit();
  }

  commit();
  vv.addEventListener('resize', scheduleCommit);
  vv.addEventListener('scroll', scheduleCommit);
  window.addEventListener('resize', scheduleCommit);
  window.addEventListener('orientationchange', () => {
    setTimeout(resetSpanAndCommit, 150);
  });
})();
