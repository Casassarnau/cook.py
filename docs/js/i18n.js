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

    getIngredientTranslation(ingredientKey) {
      return this.t(`ingredients.${ingredientKey}`, null);
    },

    resolveIngredientName(translation, value, unit) {
      if (typeof translation === 'string') return translation;
      if (translation && typeof translation === 'object') {
        const useSingular = value === 1 && !unit;
        return useSingular ? translation['1'] : translation['1+'];
      }
      return null;
    },

    ingredientName(ingredientKey, value = null, unit = null) {
      const translation = this.getIngredientTranslation(ingredientKey);
      return this.resolveIngredientName(translation, value, unit) || ingredientKey;
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
