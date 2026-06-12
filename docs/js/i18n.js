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
  };
}
