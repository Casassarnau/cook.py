function recipeApp() {
  return {
    index: [],
    recipesCache: {},
    categories: [],
    searchQuery: '',
    filterCategory: '',
    selectedRecipe: null,
    selectedVariation: '',
    lang: 'en',
    translations: {},
    emojis: {},
    darkMode: false,
    basePath: '',
    currentServings: 4,
    currentDimensions: { width: 20, height: 20, diameter: 15 },
    currentDiameter: 15,
    currentUnits: 1,
    showDimensionConfig: false,
    dimensionConfigShape: 'rectangular',
    dimensionConfigDiameter: 15,
    dimensionConfigWidth: 20,
    dimensionConfigHeight: 20,

    async init() {
      this.basePath = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : '/cook.py';
      const savedTheme = localStorage.getItem('theme');
      this.darkMode = savedTheme ? savedTheme === 'dark' : false;
      document.documentElement.classList.toggle('dark', this.darkMode);
      this.lang = localStorage.getItem('lang') || 'en';
      this.$watch('lang', v => {
        localStorage.setItem('lang', v);
        this.loadTranslations();
      });
    
      
      
      // Load saved servings/diameter preferences
      this.loadServingsPreferences();
      
      await this.loadTranslations();
      await this.loadEmojis();
      await this.loadIndex();
      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();
    },

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

    loadServingsPreferences() {
      // Load global fallbacks (for backwards compatibility)
      const savedServings = localStorage.getItem('preferredServings');
      const savedDiameter = localStorage.getItem('preferredDiameter');
      const savedUnits = localStorage.getItem('preferredUnits');
      const savedDimensions = localStorage.getItem('preferredDimensions');
      
      if (savedServings) {
        this.currentServings = parseInt(savedServings, 10) || 4;
      }
      if (savedDiameter) {
        this.currentDiameter = parseInt(savedDiameter, 10) || 15;
      }
      if (savedUnits) {
        this.currentUnits = parseInt(savedUnits, 10) || 1;
      }
      if (savedDimensions) {
        try {
          this.currentDimensions = JSON.parse(savedDimensions);
        } catch (e) {
          console.error('Failed to parse saved dimensions:', e);
        }
      }
    },

    loadRecipePreferences(recipeName) {
      if (!recipeName) return;
      
      const key = `recipePreferences_${recipeName}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          if (prefs.servings !== undefined) this.currentServings = prefs.servings;
          if (prefs.units !== undefined) this.currentUnits = prefs.units;
          if (prefs.diameter !== undefined) this.currentDiameter = prefs.diameter;
          if (prefs.dimensions) {
            Object.assign(this.currentDimensions, prefs.dimensions);
          }
        } catch (e) {
          console.error('Failed to parse recipe preferences:', e);
        }
      }
    },

    saveRecipePreferences(recipeName) {
      if (!recipeName) return;
      
      const key = `recipePreferences_${recipeName}`;
      const prefs = {
        servings: this.currentServings,
        units: this.currentUnits,
        diameter: this.currentDiameter,
        dimensions: { ...this.currentDimensions }
      };
      
      localStorage.setItem(key, JSON.stringify(prefs));
    },

    saveServingsPreferences() {
      // Save global preferences (shared across all recipes)
      localStorage.setItem('preferredServings', this.currentServings.toString());
      localStorage.setItem('preferredDiameter', this.currentDiameter.toString());
      localStorage.setItem('preferredUnits', this.currentUnits.toString());
      localStorage.setItem('preferredDimensions', JSON.stringify(this.currentDimensions));
      
      // Only save per-recipe preferences for units-based recipes
      if (this.selectedRecipe) {
        const portion = this.selectedRecipe.portion;
        const isUnitsRecipe = portion?.type === 'units' || this.selectedRecipe.units;
        
        if (isUnitsRecipe) {
          const recipeName = this.getRecipeName();
          if (recipeName) {
            this.saveRecipePreferences(recipeName);
          }
        }
      }
    },

    getRecipeName() {
      if (!this.selectedRecipe) return null;
      
      // Check hash first (current route format)
      const hash = location.hash;
      if (hash && hash.startsWith('#recipe=')) {
        const params = new URLSearchParams(hash.substring(1));
        const recipe = params.get('recipe');
        if (recipe) return recipe;
      }
      
      // Try to get from URL search params (alternative format)
      const urlParams = new URLSearchParams(window.location.search);
      const recipe = urlParams.get('recipe');
      if (recipe) return recipe;
      
      // Try to get from recipe path
      const path = this.selectedRecipe.path;
      if (path && path.includes('recipes/')) {
        return path.replace('recipes/', '').replace('.json', '');
      }
      return null;
    },

    async loadIndex() {
      const res = await fetch(this.withBase('index.json'));
      this.index = await res.json();
      const allCategories = this.index.flatMap(i => i.categories || []);
      this.categories = [...new Set(allCategories)];
    },

    async fetchRecipeByName(recipeName) {
      const item = this.index.find(i => i.path === `recipes/${recipeName}.json`);
      if (!item) return null;
      if (this.recipesCache[item.path]) return this.recipesCache[item.path];
      const res = await fetch(this.withBase(item.path));
      const data = await res.json();
      this.recipesCache[item.path] = data;
      return data;
    },

    saveVariantPreference(recipeName, variantKey) {
      const variantPrefs = JSON.parse(localStorage.getItem('variantPreferences') || '{}');
      variantPrefs[recipeName] = variantKey;
      localStorage.setItem('variantPreferences', JSON.stringify(variantPrefs));
    },

    getRecipeName() {
      if (!this.selectedRecipe) return null;
      const item = this.index.find(i => i.title.en === this.selectedRecipe.title.en);
      return item ? item.path.replace('recipes/', '').replace('.json', '') : null;
    },

    updateURL() {
      if (!this.selectedRecipe) {
        location.hash = '';
        return;
      }
      
      const recipeName = this.getRecipeName();
      if (!recipeName) return;

      location.hash = this.selectedVariation ? `#recipe=${recipeName}&variant=${this.selectedVariation}` : `#recipe=${recipeName}`;
    },

    t(key, defaultValue = key) {
      return key.split('.').reduce((acc, part) => acc?.[part], this.translations) ?? defaultValue;
    },

    translateField(field) {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[this.lang] || field['en'] || '';
    },

    // Helper function to normalize text for accent-insensitive search
    normalizeText(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    },

    // Helper function to check if search query contains ingredient search prefix
    isIngredientSearch(query) {
      const prefix = this.t("ingredients._") + ":";
      return query.toLowerCase().startsWith(prefix.toLowerCase())
    },

    // Helper function to extract search terms from query (comma-separated)
    getSearchTerms(query) {
      if (this.isIngredientSearch(query)) {
        // Extract the part after the colon
        const colonIndex = query.indexOf(':');
        const searchPart = colonIndex !== -1 ? query.substring(colonIndex + 1).trim() : query;
        return searchPart.split(',').map(term => term.trim()).filter(term => term.length > 0);
      }
      return query.split(',').map(term => term.trim()).filter(term => term.length > 0);
    },

    // Helper function to check if recipe matches search terms
    matchesSearchTerms(recipe, searchTerms, isIngredientSearch) {
      if (isIngredientSearch) {
        // Search in ingredient keys
        const ingredientKeys = recipe.ingredient_keys || [];
        const ingredientNames = ingredientKeys.flatMap(key => {
          const names = [this.t(`ingredients.${key}`)];
          const singular = this.t(`ingredients.${key}_single`, null);
          // If singular exists and isn't the same as plural, include it
          if (singular && singular !== names[0]) {
            names.push(singular);
          }
          return names;
        });
        return searchTerms.every(term => 
          ingredientNames.some(key => 
            this.normalizeText(key).includes(this.normalizeText(term))
          )
        );
      } else {
        // Search in title
        const title = this.translateField(recipe.title);
        return searchTerms.some(term => 
          this.normalizeText(title).includes(this.normalizeText(term))
        );
      }
    },

    filteredCards() {
      return this.index.filter(i => {
        // Handle search query
        let matchSearch = true;
        if (this.searchQuery.trim()) {
          const isIngredientSearch = this.isIngredientSearch(this.searchQuery);
          const searchTerms = this.getSearchTerms(this.searchQuery);
          matchSearch = this.matchesSearchTerms(i, searchTerms, isIngredientSearch);
        }
        
        // Handle category filter
        const cats = i.categories || [];
        const matchCat = this.filterCategory ? cats.includes(this.filterCategory) : true;
        
        return matchSearch && matchCat;
      });
    },

    async handleRoute() {
      const hash = location.hash;
      if (hash.startsWith('#recipe=')) {
        const params = new URLSearchParams(hash.substring(1));
        const recipeName = params.get('recipe');
        const variantKey = params.get('variant');
        
        if (recipeName) {
          const recipe = await this.fetchRecipeByName(recipeName);
          this.selectedRecipe = recipe || null;
          
          if (this.selectedRecipe) {
            // Use saved preferences or fall back to recipe defaults
            if (this.selectedRecipe.portion) {
              const portion = this.selectedRecipe.portion;
              if (portion.type === 'servings') {
                this.currentServings = this.currentServings || portion.value || 4;
              } else if (portion.type === 'units') {
                // Load per-recipe preferences only for units-based recipes
                this.loadRecipePreferences(recipeName);
                this.currentUnits = this.currentUnits || portion.value || 1;
              } else if (portion.type === 'area') {
                if (portion.shape === 'circular') {
                  this.currentDimensions.diameter = this.currentDimensions.diameter || portion.dimensions.diameter || 15;
                } else if (portion.shape === 'rectangular' || portion.shape === 'square') {
                  this.currentDimensions.width = this.currentDimensions.width || portion.dimensions.width || 20;
                  this.currentDimensions.height = this.currentDimensions.height || portion.dimensions.height || 20;
                }
              } else if (portion.type === 'diameter') {
                this.currentDiameter = this.currentDiameter || portion.value || 15;
              }
            }
            // Legacy support for old structure
            if (this.selectedRecipe.servings) {
              this.currentServings = this.currentServings || this.selectedRecipe.servings.value || 4;
            }
            if (this.selectedRecipe.units) {
              // Load per-recipe preferences only for units-based recipes
              this.loadRecipePreferences(recipeName);
              this.currentUnits = this.currentUnits || this.selectedRecipe.units.value || 1;
            }
            if (this.selectedRecipe.diameter) {
              this.currentDiameter = this.currentDiameter || this.selectedRecipe.diameter.value || 15;
            }
            
            // Set variant from URL or localStorage after recipe is loaded
            if (variantKey) {
              this.selectedVariation = variantKey;
              this.saveVariantPreference(recipeName, variantKey);
            } else {
              const variantPrefs = JSON.parse(localStorage.getItem('variantPreferences') || '{}');
              const savedVariant = variantPrefs[recipeName];
              if (savedVariant) {
                this.selectedVariation = savedVariant;
              } else if (this.selectedRecipe.variants && this.selectedRecipe.variants.length > 0) {
                // Set default to first variant if no preference is saved
                this.selectedVariation = this.selectedRecipe.variants[0].key;
              }
            }
          }
        }
      } else {
        this.selectedRecipe = null;
      }
    },

    goHome() {
      location.hash = '';
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', this.darkMode);
    },

    hasVariants() {
      const r = this.selectedRecipe;
      return r && Array.isArray(r.variants) && r.variants.length > 0;
    },

    getMultiplier() {
      if (!this.selectedRecipe) return 1;
      
      // New unified structure
      if (this.selectedRecipe.portion) {
        const portion = this.selectedRecipe.portion;
        if (portion.type === 'servings') {
          return this.currentServings / portion.value;
        } else if (portion.type === 'units') {
          return this.currentUnits / portion.value;
        } else if (portion.type === 'area') {
          if (portion.shape === 'circular') {
            const originalDiameter = portion.dimensions.diameter;
            return Math.pow(this.currentDimensions.diameter / originalDiameter, 2);
          } else if (portion.shape === 'rectangular' || portion.shape === 'square') {
            const originalArea = portion.dimensions.width * portion.dimensions.height;
            const currentArea = this.currentDimensions.width * this.currentDimensions.height;
            return currentArea / originalArea;
          }
        } else if (portion.type === 'diameter') {
          // Legacy diameter type
          const originalDiameter = portion.value;
          return Math.pow(this.currentDiameter / originalDiameter, 2);
        }
      }
      
      // Legacy support for old structure
      if (this.selectedRecipe.servings) {
        return this.currentServings / this.selectedRecipe.servings.value;
      } else if (this.selectedRecipe.units) {
        return this.currentUnits / this.selectedRecipe.units.value;
      } else if (this.selectedRecipe.diameter) {
        // For diameter, we need to calculate area ratio (diameter^2)
        const originalDiameter = this.selectedRecipe.diameter.value;
        return Math.pow(this.currentDiameter / originalDiameter, 2);
      }
      
      return 1;
    },

    hasServings() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'servings') return true;
      return !!this.selectedRecipe.servings; // Legacy support
    },

    hasArea() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'area') return true;
      return false;
    },

    hasCircularArea() {
      if (!this.selectedRecipe) return false;
      return this.selectedRecipe.portion?.type === 'area' && this.selectedRecipe.portion?.shape === 'circular';
    },

    hasRectangularArea() {
      if (!this.selectedRecipe) return false;
      return this.selectedRecipe.portion?.type === 'area' && (this.selectedRecipe.portion?.shape === 'rectangular' || this.selectedRecipe.portion?.shape === 'square');
    },

    hasDiameter() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'diameter') return true;
      if (this.selectedRecipe.portion?.type === 'area' && this.selectedRecipe.portion?.shape === 'circular') return true;
      return !!this.selectedRecipe.diameter; // Legacy support
    },

    hasUnits() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'units') return true;
      return !!this.selectedRecipe.units; // Legacy support
    },

    getIngredientsTitle() {
      if (!this.selectedRecipe) return '';

      const portion = this.selectedRecipe.portion;

      if (this.hasServings()) {
        const unit = portion?.unit || this.selectedRecipe.servings?.unit || 'servings';
        const unitText = this.t(`units.${unit}`);
        const forConnector = this.t('connectors.for');
        return `${this.t('ingredients._')} ${forConnector} ${this.currentServings} ${unitText}`;
      } else if (this.hasUnits()) {
        const unit = portion?.unit || this.selectedRecipe.units?.unit || 'unit';
        const forConnector = this.t('connectors.for');
        const unitText = this.t(`units.${unit}`) || unit;
        return `${this.t('ingredients._')} ${forConnector} ${this.currentUnits} ${unitText}`;
      } else if (this.hasCircularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        const forConnector = this.t('connectors.for');
        return `${this.t('ingredients._')} ${forConnector} ø ${this.currentDimensions.diameter} ${unitText} 🍰`;
      } else if (this.hasRectangularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        const forConnector = this.t('connectors.for');
        return `${this.t('ingredients._')} ${forConnector} ${this.currentDimensions.width}×${this.currentDimensions.height} ${unitText} 📐`;
      } else if (this.hasDiameter()) {
        const unit = portion?.unit || this.selectedRecipe.diameter?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        const forConnector = this.t('connectors.for');
        const connector = this.t(`connectors.${unit}`);
        
        // For circular measurements (cm), show diameter symbol
        if (unit === 'cm') {
          return `${this.t('ingredients._')} ${forConnector} ø ${this.currentDiameter} ${unitText} 🍰`;
        } else {
          // For other units (like pizza), show without diameter symbol
          return `${this.t('ingredients._')} ${forConnector} ${this.currentDiameter} ${connector} ${unitText}`;
        }
      }
      
      return this.t('ingredients._');
    },

    incrementDimensions() {
      if (this.hasCircularArea()) {
        this.currentDimensions.diameter += 1;
        this.saveServingsPreferences();
      } else if (this.hasRectangularArea()) {
        // For rectangular, increment both dimensions to maintain CURRENT aspect ratio
        const aspectRatio = this.currentDimensions.width / this.currentDimensions.height;
        this.currentDimensions.width += 1;
        this.currentDimensions.height = Math.round(this.currentDimensions.width / aspectRatio);
        this.saveServingsPreferences();
      } else {
        this.incrementServings();
      }
    },

    decrementDimensions() {
      if (this.hasCircularArea()) {
        if (this.currentDimensions.diameter > 1) {
          this.currentDimensions.diameter -= 1;
          this.saveServingsPreferences();
        }
      } else if (this.hasRectangularArea()) {
        if (this.currentDimensions.width > 5) {
          // For rectangular, decrement both dimensions to maintain CURRENT aspect ratio
          const aspectRatio = this.currentDimensions.width / this.currentDimensions.height;
          this.currentDimensions.width -= 1;
          this.currentDimensions.height = Math.round(this.currentDimensions.width / aspectRatio);
          this.saveServingsPreferences();
        }
      } else {
        this.decrementServings();
      }
    },

    openDimensionConfig() {
      if (!this.selectedRecipe?.portion) return;
      
      const portion = this.selectedRecipe.portion;
      
      // Initialize config values from current state
      if (portion.type === 'area') {
        this.dimensionConfigShape = portion.shape;
        
        if (portion.shape === 'circular') {
          this.dimensionConfigDiameter = this.currentDimensions.diameter || portion.dimensions.diameter;
        } else {
          this.dimensionConfigWidth = this.currentDimensions.width || portion.dimensions.width;
          this.dimensionConfigHeight = this.currentDimensions.height || portion.dimensions.height;
        }
      }
      
      this.showDimensionConfig = true;
    },

    setAreaShape(shape) {
      this.dimensionConfigShape = shape;
      
      // Auto-adjust dimensions when switching shapes
      if (shape === 'circular') {
        // Convert rectangular to circular area: estimate diameter from area
        const area = this.dimensionConfigWidth * this.dimensionConfigHeight;
        this.dimensionConfigDiameter = Math.round(Math.sqrt(area / Math.PI) * 2);
      } else {
        // Convert circular to square area: estimate sides from area
        const area = Math.PI * Math.pow(this.dimensionConfigDiameter / 2, 2);
        const side = Math.round(Math.sqrt(area));
        this.dimensionConfigWidth = side;
        this.dimensionConfigHeight = side;
      }
    },

    applyDimensionChanges() {
      if (!this.selectedRecipe?.portion) {
        this.showDimensionConfig = false;
        return;
      }
      
      const portion = this.selectedRecipe.portion;
      
      if (portion.type === 'area') {
        // Update the original portion's shape
        portion.shape = this.dimensionConfigShape;
        
        if (this.dimensionConfigShape === 'circular') {
          portion.dimensions.diameter = this.dimensionConfigDiameter;
          this.currentDimensions.diameter = this.dimensionConfigDiameter;
        } else {
          portion.dimensions.width = this.dimensionConfigWidth;
          portion.dimensions.height = this.dimensionConfigHeight;
          this.currentDimensions.width = this.dimensionConfigWidth;
          this.currentDimensions.height = this.dimensionConfigHeight;
        }
      }
      
      this.saveServingsPreferences();
      this.showDimensionConfig = false;
    },

    getIngredientEmoji(ingredientKey) {
      return this.emojis[ingredientKey] || '•';
    },

    incrementServings() {
      if (this.hasServings()) {
        this.currentServings = Math.min(this.currentServings + 1, 20);
        this.saveServingsPreferences();
      } else if (this.hasUnits()) {
        this.currentUnits = Math.min(this.currentUnits + 1, 20);
        this.saveServingsPreferences();
      } else if (this.hasDiameter()) {
        this.currentDiameter = Math.min(this.currentDiameter + 1, 50);
        this.saveServingsPreferences();
      }
    },

    decrementServings() {
      if (this.hasServings()) {
        this.currentServings = Math.max(this.currentServings - 1, 1);
        this.saveServingsPreferences();
      } else if (this.hasUnits()) {
        this.currentUnits = Math.max(this.currentUnits - 1, 1);
        this.saveServingsPreferences();
      } else if (this.hasDiameter()) {
        this.currentDiameter = Math.max(this.currentDiameter - 1, 5);
        this.saveServingsPreferences();
      }
    },

    formatValue(value) {
      if (value === 0) return '0';
      const formatted = parseFloat(value).toFixed(2);
      return formatted.replace(/\.?0+$/, '');
    },

    pluralizeIngredient(ingredientKey, value, unit) {
      // Use singular only if value is 1 and unit is null/undefined (countable items)
      const useSingular = value === 1 && !unit;
      
      if (useSingular) {
        // Try to get singular version
        const singularKey = `${ingredientKey}_single`;
        const singularName = this.t(`ingredients.${singularKey}`);
        return singularName || this.t(`ingredients.${ingredientKey}`) || ingredientKey;
      }
      
      // Otherwise use the base form (which is plural)
      return this.t(`ingredients.${ingredientKey}`) || ingredientKey;
    },

    currentIngredients() {
      const raw = this.selectedRecipe.ingredients || [];
      const variationKey = this.selectedVariation;
      const multiplier = this.getMultiplier();
      
      // Check if ingredients are grouped
      if (raw.length > 0 && raw[0].group) {
        // Grouped ingredients
        return raw.map(group => ({
          isGroup: true,
          groupName: this.translateField(group.group),
          items: this.processIngredientList(group.items || [], variationKey, multiplier)
        }));
      } else {
        // Legacy flat ingredients
        return [{
          isGroup: false,
          groupName: null,
          items: this.processIngredientList(raw, variationKey, multiplier)
        }];
      }
    },

    processIngredientList(ingredients, variationKey, multiplier) {
      return ingredients
        .filter(e => {
          if (!e.onlyForVariation) return true;
          const allowed = Array.isArray(e.onlyForVariation) ? e.onlyForVariation : [e.onlyForVariation];
          return variationKey && allowed.includes(variationKey);
        })
        .map(e => {
          const unit = e.unit ? this.t(`units.${e.unit}`) || e.unit : '';
          const connector = e.unit ? this.t(`connectors.${e.unit}`) || '' : '';
          const text = this.translateField(e.text);
          const emoji = this.getIngredientEmoji(e.ingredient);
          
          let displayValue = '';
          let displayUnit = '';
          let displayConnector = '';
          let ingredientName = '';
          
          if (e.value === 0) {
            displayValue = '';
            displayUnit = unit;
            displayConnector = connector;
            ingredientName = this.t(`ingredients.${e.ingredient}`) || e.ingredient;
          } else {
            const calculatedValue = e.value * multiplier;
            displayValue = this.formatValue(calculatedValue);
            displayUnit = unit;
            displayConnector = connector;
            // Pluralize ingredient name based on calculated value and unit
            ingredientName = this.pluralizeIngredient(e.ingredient, calculatedValue, e.unit);
          }
          
          return {
            emoji: emoji,
            value: displayValue,
            unit: displayUnit,
            unitKey: e.unit,
            connector: displayConnector,
            name: ingredientName,
            text: text
          };
        });
    },

    currentInstructions() {
      const raw = this.selectedRecipe.instructions || [];
      const variationKey = this.selectedVariation;
      return raw
        .filter(e => {
          if (!e.onlyForVariation) return true;
          const allowed = Array.isArray(e.onlyForVariation) ? e.onlyForVariation : [e.onlyForVariation];
          return variationKey && allowed.includes(variationKey);
        })
        .map(e => ({
          text: this.translateField(e.text),
          image: e.image ? this.withBase(e.image) : null
        }));
    },
  };
}
