function recipeI18n() {
  return {
    async loadTranslations() {
      try {
        const res = await fetch(this.withBase(`translations/${this.lang}.json`));
        this.translations = await res.json();
      } catch {
        console.warn('No translation file found for', this.lang);
      }
    },

    async loadEmojis() {
      try {
        const res = await fetch(this.withBase('translations/emoji.json'));
        this.emojis = await res.json();
      } catch {
        console.warn('No emoji file found');
      }
    },

    t(key, defaultValue = key) {
      return key.split('.').reduce((acc, part) => acc?.[part], this.translations) ?? defaultValue;
    },

    translateField(field) {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[this.lang] || field['en'] || '';
    },

    getIngredientEmoji(ingredientKey) {
      return this.emojis[ingredientKey] || '•';
    },

    resolvePluralizedName(translation, useSingular) {
      if (typeof translation === 'string') return translation;
      if (translation && typeof translation === 'object') {
        const value = useSingular ? translation['1'] : translation['1+'];
        return typeof value === 'string' ? value : null;
      }
      return null;
    },

    formatLocalizedLabel(section, key, count = null) {
      if (typeof key !== 'string') return '';
      const translation = this.t(`${section}.${key}`, null);
      if (count == null) {
        return this.resolvePluralizedName(translation, false) ||
          (typeof translation === 'string' ? translation : key);
      }
      return this.resolvePluralizedName(translation, Number(count) === 1) ||
        (typeof translation === 'string' ? translation : key);
    },

    getIngredientTranslation(ingredientKey) {
      return this.t(`ingredients.${ingredientKey}`, null);
    },

    getUnitTranslation(unitKey) {
      return this.t(`units.${unitKey}`, null);
    },

    resolveIngredientName(translation, value, unitKey) {
      const useSingular = value === 1 && !unitKey;
      return this.resolvePluralizedName(translation, useSingular);
    },

    ingredientName(ingredientKey, value = null, unitKey = null) {
      const translation = this.getIngredientTranslation(ingredientKey);
      return this.resolveIngredientName(translation, value, unitKey) || ingredientKey;
    },

    unitName(unitKey, count = null) {
      return this.formatLocalizedLabel('units', unitKey, count);
    },

    ingredientSearchNames(ingredientKey) {
      const translation = this.getIngredientTranslation(ingredientKey);
      if (typeof translation === 'string') return [translation];
      if (translation && typeof translation === 'object') {
        return [...new Set([translation['1'], translation['1+']].filter(Boolean))];
      }
      return [ingredientKey];
    },
  };
}
