const ERROR_IMAGE = '/images/error.webp';

function recipeUtils() {
  return {
    getImageUrl(path, type) {
      let resolved = path || ERROR_IMAGE;
      if (type === 'lower') {
        resolved = resolved.replace('.webp', '_lower.webp');
      }
      return this.withBase(resolved);
    },

    handleImageError(event, lower = true) {
      const img = event?.target;
      if (!img) return;
      img.onerror = null;
      img.src = this.getImageUrl(ERROR_IMAGE, lower ? 'lower' : null);
    },

    withBase(path) {
      if (!path) return path;
      const base = this.basePath.replace(/\/$/, '');
      const p = String(path).replace(/^\//, '');
      return base ? `${base}/${p}` : p;
    },

    formatValue(value) {
      if (value === 0) return '0';
      const formatted = parseFloat(value).toFixed(2);
      return formatted.replace(/\.?0+$/, '');
    },

    normalizeText(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    },
  };
}
