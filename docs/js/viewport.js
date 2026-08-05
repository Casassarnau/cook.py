/**
 * Chromium: interactive-widget=overlays-content + VirtualKeyboard API keep
 * the layout viewport stable, so position:fixed bottom UI does not jump.
 *
 * Firefox Android (no VirtualKeyboard API) still moves visualViewport when
 * the dynamic toolbar animates. Tracking those intermediate sizes causes
 * flicker — especially while scrolling. Instead, freeze a stable pin after
 * load and only re-pin for the virtual keyboard (large inset) or orientation
 * changes.
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

  const KEYBOARD_INSET_MIN = 120;
  const EPSILON = 0.5;

  let stable = {
    top: 0,
    height: 0,
    bottom: 0
  };
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

  function captureStable() {
    const raw = readRaw();
    // Prefer the smaller visible height (toolbar expanded) so docks stay
    // clear of a bottom toolbar without updating during collapse.
    if (!stable.height || raw.height < stable.height) {
      stable = {
        top: raw.top,
        height: raw.height,
        bottom: raw.bottom < 8 ? 0 : raw.bottom,
      };
    } else if (raw.bottom > stable.bottom && raw.bottom < KEYBOARD_INSET_MIN) {
      stable = {
        ...stable,
        bottom: raw.bottom
      };
    }
    return stable;
  }

  function restoreStable() {
    keyboardOpen = false;
    apply(captureStable());
  }

  function onViewportChange() {
    const raw = readRaw();

    if (raw.bottom >= KEYBOARD_INSET_MIN) {
      keyboardOpen = true;
      clearTimeout(keyboardTimer);
      // Keyboard resize can emit a few steps — settle briefly.
      keyboardTimer = setTimeout(() => {
        keyboardTimer = null;
        apply(readRaw());
      }, 50);
      return;
    }

    if (keyboardOpen) {
      clearTimeout(keyboardTimer);
      keyboardTimer = null;
      restoreStable();
      return;
    }

    // Dynamic toolbar only: learn a stable expanded-chrome size once, but
    // do not apply intermediate animation frames (those cause the flicker).
    captureStable();
  }

  function onOrientationChange() {
    stable = {
      top: 0,
      height: 0,
      bottom: 0
    };
    keyboardOpen = false;
    clearTimeout(keyboardTimer);
    keyboardTimer = null;
    setTimeout(() => {
      apply(captureStable());
    }, 200);
  }

  apply(captureStable());
  // Re-sample shortly after load — the toolbar state can settle after paint.
  setTimeout(() => apply(captureStable()), 300);

  vv.addEventListener('resize', onViewportChange);
  vv.addEventListener('scroll', onViewportChange);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onOrientationChange);
})();
