function recipeUtils() {
  return {
    getImageUrl(path, type) {
      if (type === 'lower') {
        path = path.replace('.webp', '_lower.webp');
      }
      return this.withBase(path);
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
