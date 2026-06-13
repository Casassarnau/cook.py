function assetPath(relativePath) {
  const base =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1' ?
    '' :
    '/cook.py';
  const p = String(relativePath).replace(/^\//, '');
  return base ? `${base}/${p}` : p;
}
