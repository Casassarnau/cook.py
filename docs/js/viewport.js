/**
 * Keep fixed bottom UI stable across mobile browser chrome.
 *
 * - Chromium: interactive-widget=overlays-content + VirtualKeyboard API.
 * - Firefox Android: env(safe-area-inset-bottom) grows/shrinks with the
 *   dynamic toolbar, so docks look taller at the page top. Lock it to 0
 *   and rely on the constant .safe-area-pb minimum padding instead.
 * - Firefox Android: never pin to visualViewport for the toolbar (flickers).
 *   Only pin while the virtual keyboard is open.
 */
(function stabilizeMobileViewport() {
  const root = document.documentElement;
  const KEYBOARD_INSET_MIN = 120;
  const EPSILON = 0.5;
  const isFirefoxAndroid =
    /Android/i.test(navigator.userAgent) && /Firefox/i.test(navigator.userAgent);

  try {
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }
  } catch {
    // API may be present but reject writes in some WebViews.
  }

  function readSafeAreaPx() {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;' +
      'padding-bottom:env(safe-area-inset-bottom,0px)';
    root.appendChild(probe);
    const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    return px;
  }

  function lockSafeArea() {
    // Firefox Android's live env() tracks the toolbar — freeze a constant.
    const px = isFirefoxAndroid ? 0 : readSafeAreaPx();
    root.style.setProperty('--safe-area-bottom', `${px}px`);
  }

  lockSafeArea();
  window.addEventListener('orientationchange', () => {
    setTimeout(lockSafeArea, 200);
  });

  const vv = window.visualViewport;
  const needsKeyboardPin =
    vv &&
    /Android/i.test(navigator.userAgent) &&
    !('virtualKeyboard' in navigator);

  if (!needsKeyboardPin) return;

  let keyboardOpen = false;
  let keyboardTimer = null;
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

  function openKeyboardPin() {
    keyboardOpen = true;
    root.classList.add('vv-pin');
    apply(readRaw());
  }

  function closeKeyboardPin() {
    if (!keyboardOpen && !root.classList.contains('vv-pin')) return;
    keyboardOpen = false;
    root.classList.remove('vv-pin');
    applied = {
      top: NaN,
      height: NaN,
      bottom: NaN
    };
  }

  function onViewportChange() {
    const bottom = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);

    if (bottom >= KEYBOARD_INSET_MIN) {
      clearTimeout(keyboardTimer);
      keyboardTimer = setTimeout(() => {
        keyboardTimer = null;
        openKeyboardPin();
      }, 50);
      return;
    }

    clearTimeout(keyboardTimer);
    keyboardTimer = null;
    closeKeyboardPin();
  }

  vv.addEventListener('resize', onViewportChange);
  vv.addEventListener('scroll', onViewportChange);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      lockSafeArea();
      closeKeyboardPin();
    }, 200);
  });
})();
