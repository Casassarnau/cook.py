const INCLUDE_RE = /<!-- @include ([^\s]+) -->/g;

const HTML_COMPONENTS = [{
  slot: '#component-header',
  path: 'components/header.html'
}, {
  slot: '#component-app-shell',
  path: 'components/app-shell.html'
}, {
  slot: '#component-modals',
  path: 'components/modals.html'
}, ];

async function fetchComponent(path) {
  const res = await fetch(assetPath(path));
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

async function resolveIncludes(html) {
  let result = html;
  let matches = [...result.matchAll(INCLUDE_RE)];

  while (matches.length > 0) {
    for (const match of matches) {
      const includePath = `components/${match[1]}`;
      let included = await fetchComponent(includePath);
      included = await resolveIncludes(included);
      result = result.replace(match[0], included);
    }
    matches = [...result.matchAll(INCLUDE_RE)];
  }

  return result;
}

async function loadHtmlComponents() {
  await Promise.all(
    HTML_COMPONENTS.map(async ({
      slot,
      path
    }) => {
      const el = document.querySelector(slot);
      if (!el) return;
      const html = await resolveIncludes(await fetchComponent(path));
      el.innerHTML = html;
    })
  );
}

async function loadAlpine() {
  if (window.Alpine) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Alpine.js'));
    document.head.appendChild(script);
  });
}

(async function bootstrap() {
  try {
    await loadHtmlComponents();
  } catch (err) {
    console.error('Failed to load HTML components:', err);
  }

  document.documentElement.classList.remove('bootstrap-pending');
  await loadAlpine();
})();
