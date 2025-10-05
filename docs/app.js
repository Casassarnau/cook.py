function recipeApp() {
  return {
    index: [],
    recipesCache: {},
    categories: [],
    searchQuery: '',
    filterCategory: '',
    selectedRecipe: null,
    selectedVariationIndex: 0,
    lang: 'en',
    translations: {},
    darkMode: false,

    async init() {
      // Load saved theme
      this.darkMode = localStorage.getItem('darkMode') === 'true';
      document.documentElement.classList.toggle('dark', this.darkMode);

      // Initialize language from local storage and keep it in sync
      this.lang = localStorage.getItem('lang') || 'en';
      this.$watch('lang', value => {
        localStorage.setItem('lang', value);
        // Reload translations when language changes
        this.loadTranslations();
      });

      await this.loadTranslations();
      await this.loadIndex();

      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();
    },

    async loadTranslations() {
      try {
        const res = await fetch(`translations/${this.lang}.json`);
        this.translations = await res.json();
      } catch {
        console.warn('No translation file found for', this.lang);
      }
    },

    async loadIndex() {
      const res = await fetch('index.json');
      this.index = await res.json();
      // Gather unique categories from items that may include multiple categories
      const allCategories = this.index.flatMap(i => i.categories || []);
      this.categories = [...new Set(allCategories)];
    },

    async fetchRecipeBySlug(slug) {
      // Find the index item by slug of its title
      const item = this.index.find(i => this.slugify(i.title) === slug);
      if (!item) return null;

      // Use in-memory cache by path
      if (this.recipesCache[item.path]) {
        return this.recipesCache[item.path];
      }

      const res = await fetch(item.path);
      const data = await res.json();
      this.recipesCache[item.path] = data;
      return data;
    },

    t(key) {
      // Support nested translation keys like "group.subkey"
      const value = key.split('.').reduce((acc, part) => {
        if (acc === undefined || acc === null) return undefined;
        return acc[part];
      }, this.translations);
      return value !== undefined ? value : key;
    },

    translateField(field) {
      if (typeof field === 'string') return field;
      return field[this.lang] || field['en'];
    },

    filteredCards() {
      // Filter using index items (no translations here, title is a string)
      return this.index.filter(i => {
        const title = (i.title || '').toLowerCase();
        const matchSearch = title.includes(this.searchQuery.toLowerCase());
        const cats = i.categories || [];
        const matchCat = this.filterCategory ? cats.includes(this.filterCategory) : true;
        return matchSearch && matchCat;
      });
    },

    slugify(text) {
      return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    },

    async handleRoute() {
      const hash = location.hash;
      if (hash.startsWith('#/recipe/')) {
        const slug = hash.replace('#/recipe/', '');
        const recipe = await this.fetchRecipeBySlug(slug);
        this.selectedRecipe = recipe || null;
        this.selectedVariationIndex = 0;
      } else {
        this.selectedRecipe = null;
      }
    },

    goHome() {
      location.hash = '#/';
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      document.documentElement.classList.toggle('dark', this.darkMode);
    },

    hasIngredientVariations() {
      const r = this.selectedRecipe;
      return r && Array.isArray(r.ingredientVariations) && r.ingredientVariations.length > 0;
    },

    variationNames() {
      if (!this.hasIngredientVariations()) return [];
      return this.selectedRecipe.ingredientVariations.map(v => this.translateField(v.name));
    },

    currentIngredients() {
      if (this.hasIngredientVariations()) {
        const v = this.selectedRecipe.ingredientVariations[this.selectedVariationIndex] || this.selectedRecipe.ingredientVariations[0];
        return this.translateField(v.ingredients) || [];
      }
      return this.translateField(this.selectedRecipe.ingredients) || [];
    },

    selectedVariationKey() {
      if (!this.hasIngredientVariations()) return undefined;
      const v = this.selectedRecipe.ingredientVariations[this.selectedVariationIndex] || this.selectedRecipe.ingredientVariations[0];
      return v.key;
    },

    normalizeInstructionEntry(entry) {
      // Accept plain string or object { text: localizedStringOrObject, onlyForVariation?: string | string[] }
      if (typeof entry === 'string') {
        return { text: entry };
      }
      return entry || {};
    },

    currentInstructions() {
      const raw = this.translateField(this.selectedRecipe.instructions) || [];
      // raw might be an array of strings or an array of objects with localizable text
      const variationKey = this.selectedVariationKey();
      return raw
        .map(e => this.normalizeInstructionEntry(e))
        .filter(e => {
          if (!e.onlyForVariation) return true;
          const allowed = Array.isArray(e.onlyForVariation) ? e.onlyForVariation : [e.onlyForVariation];
          return variationKey && allowed.includes(variationKey);
        })
        .map(e => this.translateField(e.text ?? e));
    }
  };
}
