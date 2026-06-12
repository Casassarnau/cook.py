function recipeApp() {
  return {
    index: [],
    recipesCache: {},
    categories: [],
    searchQuery: '',
    filterCategory: '',
    selectedRecipe: null,
    selectedVariation: '',
    thermomixEnabled: false,
    thermomixAvailable: false,
    lang: 'en',
    translations: {},
    emojis: {},
    darkMode: false,
    basePath: '',
    currentServings: 4,
    currentDimensions: { width: 20, height: 20, diameter: 15 },
    originalDimensions: null, // Store original recipe dimensions (never change)
    originalShape: null, // Store original recipe shape (never change)
    currentDiameter: 15,
    currentUnits: 1,
    showDimensionConfig: false,
    dimensionConfigShape: 'rectangular',
    dimensionConfigDiameter: 15,
    dimensionConfigWidth: 20,
    dimensionConfigHeight: 20,
    showQRModal: false,
    showImageModal: false,
    showCookAdjustModal: false,
    cookMode: false,
    cookStepIndex: 0,
    cookTouchStartX: null,
    cookTouchStartY: null,
    cookTouchScrolling: false,
    cookSwipeOffset: 0,
    cookSwipeTransition: false,
    cookSwipeActive: false,
    cookSwipeAnimating: false,
    cookAnimPreviewIndex: null,
    cookPreviewOffset: 0,
    cookPreviewTransition: false,
    cookLayoutStepHeight: null,
    cookLayoutIngredientsHeight: null,
    cookLayoutTransitionEnabled: false,
    cookLayoutResizeHandler: null,
    cookStepContentOverflows: false,
    urlCopied: false,
    routePending: (() => {
      const hash = location.hash;
      if (!hash.startsWith('#recipe=')) return false;
      return !!new URLSearchParams(hash.substring(1)).get('recipe');
    })(),

    hasRecipeHash() {
      const hash = location.hash;
      if (!hash.startsWith('#recipe=')) return false;
      return !!new URLSearchParams(hash.substring(1)).get('recipe');
    },

    getActiveRecipeSlug() {
      if (!this.selectedRecipe || !this.index.length) return null;
      const item = this.index.find(i => i.title?.en === this.selectedRecipe.title?.en);
      return item ? item.path.replace('recipes/', '').replace('.json', '') : null;
    },

    finishRoutePending() {
      this.routePending = false;
      document.documentElement.classList.remove('route-pending');
    },

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
    
      
      
      await this.loadTranslations();
      await this.loadEmojis();
      await this.loadIndex();
      window.addEventListener('hashchange', () => this.handleRoute());
      await this.handleRoute();
      this.finishRoutePending();
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

    resetPortionDefaults() {
      if (!this.selectedRecipe) return;

      const recipe = this.selectedRecipe;
      const portion = recipe.portion;

      if (portion) {
        if (portion.type === 'servings') {
          this.currentServings = portion.value || 4;
        } else if (portion.type === 'units') {
          this.currentUnits = portion.value || 1;
        } else if (portion.type === 'area') {
          portion.shape = this.originalShape;
          const dims = this.originalDimensions || portion.dimensions || {};
          if (portion.shape === 'circular') {
            this.currentDimensions = { diameter: dims.diameter || 15 };
          } else {
            this.currentDimensions = {
              width: dims.width || 20,
              height: dims.height || 20
            };
          }
        } else if (portion.type === 'diameter') {
          this.currentDiameter = portion.value || 15;
        }
      }

      if (recipe.servings) {
        this.currentServings = recipe.servings.value || 4;
      }
      if (recipe.units) {
        this.currentUnits = recipe.units.value || 1;
      }
      if (recipe.diameter) {
        this.currentDiameter = recipe.diameter.value || 15;
      }
    },

    loadRecipePreferences(recipeName) {
      if (!recipeName || !this.selectedRecipe) return;

      const saved = localStorage.getItem(`recipePreferences_${recipeName}`);
      if (!saved) return;

      try {
        const prefs = JSON.parse(saved);
        const portion = this.selectedRecipe.portion;
        const recipe = this.selectedRecipe;

        if (portion?.type === 'servings' || recipe.servings) {
          if (prefs.servings !== undefined) this.currentServings = prefs.servings;
        } else if (portion?.type === 'units' || recipe.units) {
          if (prefs.units !== undefined) this.currentUnits = prefs.units;
        } else if (portion?.type === 'area') {
          if (prefs.shape) portion.shape = prefs.shape;
          if (prefs.dimensions) this.currentDimensions = { ...prefs.dimensions };
        } else if (portion?.type === 'diameter' || recipe.diameter) {
          if (prefs.diameter !== undefined) this.currentDiameter = prefs.diameter;
        }
      } catch (e) {
        console.error('Failed to parse recipe preferences:', e);
      }
    },

    saveRecipePreferences(recipeName) {
      if (!recipeName || !this.selectedRecipe) return;

      const recipe = this.selectedRecipe;
      const portion = recipe.portion;
      const prefs = {};

      if (portion?.type === 'servings' || recipe.servings) {
        prefs.servings = this.currentServings;
      } else if (portion?.type === 'units' || recipe.units) {
        prefs.units = this.currentUnits;
      } else if (portion?.type === 'area') {
        prefs.dimensions = { ...this.currentDimensions };
        prefs.shape = portion.shape;
      } else if (portion?.type === 'diameter' || recipe.diameter) {
        prefs.diameter = this.currentDiameter;
      }

      localStorage.setItem(`recipePreferences_${recipeName}`, JSON.stringify(prefs));
    },

    saveServingsPreferences() {
      const recipeName = this.getRecipeName();
      if (recipeName) {
        this.saveRecipePreferences(recipeName);
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
      const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isDev && this.recipesCache[item.path]) return this.recipesCache[item.path];
      const res = await fetch(this.withBase(item.path));
      const data = await res.json();
      this.recipesCache[item.path] = data;
      return data;
    },

    recipeHasThermomixInstructions(recipe) {
      if (!recipe) return false;
      if (Array.isArray(recipe.instructionsThermomix) && recipe.instructionsThermomix.length > 0) return true;
      return (recipe.instructions || []).some(step => step.thermomix || step.onlyForMode === 'thermomix');
    },

    saveVariantPreference(recipeName, variantKey) {
      const variantPrefs = JSON.parse(localStorage.getItem('variantPreferences') || '{}');
      variantPrefs[recipeName] = variantKey;
      localStorage.setItem('variantPreferences', JSON.stringify(variantPrefs));
    },

    saveThermomixPreference(recipeName, enabled) {
      const prefs = JSON.parse(localStorage.getItem('thermomixPreferences') || '{}');
      prefs[recipeName] = enabled;
      localStorage.setItem('thermomixPreferences', JSON.stringify(prefs));
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

      const params = new URLSearchParams();
      params.set('recipe', recipeName);
      if (this.selectedVariation) params.set('variant', this.selectedVariation);
      if (this.thermomixEnabled) params.set('thermomix', '1');
      if (this.cookMode) {
        params.set('cook', '1');
        params.set('step', String(this.cookStepIndex + 1));
      }
      location.hash = `#${params.toString()}`;
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
        const thermomixParam = params.get('thermomix');
        const cookParam = params.get('cook');
        const stepParam = params.get('step');
        
        if (recipeName) {
          const needsFetch = this.getActiveRecipeSlug() !== recipeName;
          if (needsFetch) {
            this.routePending = true;
            document.documentElement.classList.add('route-pending');
          }

          if (needsFetch) {
            const recipe = await this.fetchRecipeByName(recipeName);
            this.selectedRecipe = recipe || null;
            this.thermomixAvailable = this.recipeHasThermomixInstructions(this.selectedRecipe);
          }
          
          if (this.selectedRecipe) {
            // Store original dimensions for multiplier calculation (never change these)
            if (this.selectedRecipe.portion) {
              const portion = this.selectedRecipe.portion;
              if (portion.type === 'area') {
                this.originalShape = portion.shape;
                this.originalDimensions = { ...portion.dimensions };
              }
            }
            
            if (needsFetch) {
              this.resetPortionDefaults();
              this.loadRecipePreferences(recipeName);
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

            if (this.thermomixAvailable) {
              if (thermomixParam === '1') {
                this.thermomixEnabled = true;
                this.saveThermomixPreference(recipeName, true);
              } else {
                const thermomixPrefs = JSON.parse(localStorage.getItem('thermomixPreferences') || '{}');
                this.thermomixEnabled = !!thermomixPrefs[recipeName];
              }
            } else {
              this.thermomixEnabled = false;
            }

            if (cookParam === '1') {
              this.cookMode = true;
              document.body.classList.add('overflow-hidden');
              const parsedStep = parseInt(stepParam, 10);
              if (parsedStep >= 1) {
                this.cookStepIndex = parsedStep - 1;
              } else {
                this.cookStepIndex = this.loadCookStepIndex(recipeName);
              }
              this.clampCookStepIndex();
            } else if (this.cookMode) {
              this.exitCookMode(false);
            }
          }

          this.finishRoutePending();
        }
      } else {
        this.selectedRecipe = null;
        this.thermomixAvailable = false;
        this.thermomixEnabled = false;
        if (this.cookMode) this.exitCookMode(false);
        this.finishRoutePending();
      }
    },

    goHome() {
      if (this.cookMode) this.exitCookMode(false);
      location.hash = '';
    },

    cookStepStorageKey(recipeName) {
      return `cookProgress_${recipeName}`;
    },

    loadCookStepIndex(recipeName) {
      const saved = sessionStorage.getItem(this.cookStepStorageKey(recipeName));
      if (saved == null) return 0;
      const index = parseInt(saved, 10);
      return Number.isFinite(index) && index >= 0 ? index : 0;
    },

    saveCookStepIndex(recipeName, index) {
      sessionStorage.setItem(this.cookStepStorageKey(recipeName), String(index));
    },

    clampCookStepIndex() {
      const count = this.cookStepCount();
      if (count === 0) {
        this.cookStepIndex = 0;
        return;
      }
      this.cookStepIndex = Math.max(0, Math.min(this.cookStepIndex, count - 1));
    },

    cookStepCount() {
      return this.currentInstructions().length;
    },

    currentCookStep() {
      const steps = this.currentInstructions();
      return steps[this.cookStepIndex] || null;
    },

    getCookStepAt(index) {
      const steps = this.currentInstructions();
      return steps[index] ?? null;
    },

    cookSwipePreviewStepIndex() {
      if (this.cookAnimPreviewIndex != null) return this.cookAnimPreviewIndex;
      if (!this.cookSwipeActive) return null;
      if (this.cookSwipeOffset > 0 && this.cookStepIndex > 0) return this.cookStepIndex - 1;
      if (this.cookSwipeOffset < 0 && this.cookStepIndex < this.cookStepCount() - 1) return this.cookStepIndex + 1;
      return null;
    },

    showCookSwipePreview() {
      if (!this.isCookMobileView()) return false;
      return this.cookSwipePreviewStepIndex() != null && (this.cookSwipeActive || this.cookSwipeAnimating);
    },

    formatCookStepLabel() {
      const current = this.cookStepIndex + 1;
      const total = this.cookStepCount();
      return `${this.t('cook_step')} ${current} ${this.t('cook_of')} ${total}`;
    },

    cookProgressPercent() {
      const total = this.cookStepCount();
      if (total <= 1) return 100;
      return ((this.cookStepIndex) / (total - 1)) * 100;
    },

    cookStepPanelOverflowClass() {
      return this.cookStepContentOverflows ? ' overflow-y-auto' : ' overflow-hidden';
    },

    scheduleCookMobileLayout(enableTransition = true) {
      if (!this.cookMode || !this.isCookMobileView()) return;
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.updateCookMobileLayout(enableTransition);
        });
      });
    },

    updateCookMobileLayout() {
      if (!this.cookMode || !this.isCookMobileView()) {
        this.cookLayoutStepHeight = null;
        this.cookLayoutIngredientsHeight = null;
        this.cookLayoutTransitionEnabled = false;
        this.cookStepContentOverflows = false;
        return;
      }

      const stack = document.getElementById('cook-mobile-stack');
      const measureEl = document.getElementById('cook-step-measure');
      if (!stack || !measureEl) return;

      this.cookLayoutStepHeight = null;
      this.cookLayoutIngredientsHeight = null;
      this.cookLayoutTransitionEnabled = false;
      const panelPaddingY = 32;
      this.cookStepContentOverflows = measureEl.offsetHeight + panelPaddingY > stack.clientHeight;
    },

    cookStepPanelLayoutStyle() {
      return '';
    },

    cookMobileLayoutPanelClass() {
      return '';
    },

    bindCookMobileLayoutListeners() {
      if (this.cookLayoutResizeHandler) return;
      this.cookLayoutResizeHandler = () => this.scheduleCookMobileLayout();
      window.addEventListener('resize', this.cookLayoutResizeHandler);
    },

    unbindCookMobileLayoutListeners() {
      if (!this.cookLayoutResizeHandler) return;
      window.removeEventListener('resize', this.cookLayoutResizeHandler);
      this.cookLayoutResizeHandler = null;
    },

    resetCookMobileLayout() {
      this.cookLayoutStepHeight = null;
      this.cookLayoutIngredientsHeight = null;
      this.cookLayoutTransitionEnabled = false;
      this.cookStepContentOverflows = false;
      this.unbindCookMobileLayoutListeners();
    },

    enterCookMode() {
      const recipeName = this.getRecipeName();
      if (!recipeName || this.cookStepCount() === 0) return;
      this.cookStepIndex = this.loadCookStepIndex(recipeName);
      this.clampCookStepIndex();
      this.resetCookSwipe();
      this.cookMode = true;
      document.body.classList.add('overflow-hidden');
      this.bindCookMobileLayoutListeners();
      this.scheduleCookMobileLayout(false);
      this.updateURL();
    },

    exitCookMode(updateUrl = true) {
      this.cookMode = false;
      this.resetCookSwipe();
      this.resetCookMobileLayout();
      this.showCookAdjustModal = false;
      document.body.classList.remove('overflow-hidden');
      if (updateUrl) this.updateURL();
    },

    goToCookStep(index, options = {}) {
      const count = this.cookStepCount();
      if (count === 0) return;
      this.cookStepIndex = Math.max(0, Math.min(index, count - 1));
      if (!options.skipPersist) {
        const recipeName = this.getRecipeName();
        if (recipeName) this.saveCookStepIndex(recipeName, this.cookStepIndex);
        this.updateURL();
      }
      if (!options.skipLayout) {
        this.scheduleCookMobileLayout();
      }
    },

    isCookMobileView() {
      return window.matchMedia('(max-width: 767px)').matches;
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    cookStepTransformStyle() {
      if (!this.isCookMobileView()) return '';
      return `transform: translateX(${this.cookSwipeOffset}px)`;
    },

    cookStepSlideClass() {
      if (!this.isCookMobileView()) return '';
      return this.cookSwipeTransition ? 'cook-step-slide-transition' : '';
    },

    cookPreviewTransformStyle() {
      if (!this.isCookMobileView()) return '';
      const width = this.getCookStepPanelWidth();
      if (this.cookAnimPreviewIndex != null) {
        return `transform: translateX(${this.cookPreviewOffset}px)`;
      }
      if (this.cookSwipeOffset > 0) {
        return `transform: translateX(${-width + this.cookSwipeOffset}px)`;
      }
      if (this.cookSwipeOffset < 0) {
        return `transform: translateX(${width + this.cookSwipeOffset}px)`;
      }
      return '';
    },

    cookPreviewSlideClass() {
      if (!this.isCookMobileView()) return '';
      return this.cookPreviewTransition ? 'cook-step-slide-transition' : '';
    },

    resetCookSwipe(animated = false) {
      this.cookSwipeActive = false;
      this.cookAnimPreviewIndex = null;
      this.cookPreviewOffset = 0;
      this.cookPreviewTransition = false;
      if (animated) {
        this.cookSwipeTransition = true;
        this.cookSwipeOffset = 0;
        setTimeout(() => { this.cookSwipeTransition = false; }, 280);
      } else {
        this.cookSwipeTransition = false;
        this.cookSwipeOffset = 0;
      }
    },

    getCookStepPanelWidth() {
      const panel = document.getElementById('cook-step-panel');
      return panel ? panel.offsetWidth : window.innerWidth;
    },

    commitCookSwipe(direction) {
      if (this.cookSwipeAnimating) return;
      const count = this.cookStepCount();
      const isPrev = direction === 'prev';
      const targetIndex = this.cookStepIndex + (isPrev ? -1 : 1);
      if (targetIndex < 0 || targetIndex >= count) {
        this.resetCookSwipe(true);
        return;
      }

      if (!this.isCookMobileView() || this.prefersReducedMotion()) {
        this.goToCookStep(targetIndex);
        this.resetCookSwipe();
        return;
      }

      const width = this.getCookStepPanelWidth();
      this.cookSwipeAnimating = true;
      this.cookAnimPreviewIndex = targetIndex;
      this.cookSwipeTransition = true;
      this.cookPreviewTransition = true;

      // L→R (prev): incoming step starts on the left; R→L (next): incoming from the right
      if (isPrev) {
        this.cookPreviewOffset = -width + this.cookSwipeOffset;
      } else {
        this.cookPreviewOffset = width + this.cookSwipeOffset;
      }

      requestAnimationFrame(() => {
        this.cookSwipeOffset = isPrev ? width : -width;
        this.cookPreviewOffset = 0;
      });

      setTimeout(() => {
        this.goToCookStep(targetIndex, { skipLayout: true });
        this.cookAnimPreviewIndex = null;
        this.cookPreviewOffset = 0;
        this.cookSwipeOffset = 0;
        this.cookSwipeTransition = false;
        this.cookPreviewTransition = false;
        this.cookSwipeAnimating = false;
        this.cookSwipeActive = false;
        this.scheduleCookMobileLayout();
      }, 280);
    },

    nextCookStep() {
      if (this.cookStepIndex >= this.cookStepCount() - 1) return;
      if (this.isCookMobileView()) this.commitCookSwipe('next');
      else this.goToCookStep(this.cookStepIndex + 1);
    },

    prevCookStep() {
      if (this.cookStepIndex <= 0) return;
      if (this.isCookMobileView()) this.commitCookSwipe('prev');
      else this.goToCookStep(this.cookStepIndex - 1);
    },

    handleCookKeydown(event) {
      if (!this.cookMode || this.showCookAdjustModal) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.nextCookStep();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.prevCookStep();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.exitCookMode();
      }
    },

    handleCookTouchStart(event) {
      if (this.cookSwipeAnimating) return;
      const touch = event.touches[0];
      if (!touch) return;
      this.cookTouchStartX = touch.clientX;
      this.cookTouchStartY = touch.clientY;
      this.cookTouchScrolling = false;
      this.cookSwipeActive = false;
    },

    handleCookTouchMove(event) {
      if (this.cookSwipeAnimating || this.cookTouchStartX == null || this.cookTouchStartY == null) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - this.cookTouchStartX;
      const deltaY = touch.clientY - this.cookTouchStartY;

      if (!this.cookSwipeActive && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        this.cookTouchScrolling = true;
        return;
      }

      if (!this.isCookMobileView() || this.cookTouchScrolling) return;

      if (Math.abs(deltaX) > 10) {
        this.cookSwipeActive = true;
        this.cookSwipeTransition = false;
        let offset = deltaX;
        if (offset > 0 && this.cookStepIndex === 0) offset *= 0.35;
        if (offset < 0 && this.cookStepIndex >= this.cookStepCount() - 1) offset *= 0.35;
        this.cookSwipeOffset = offset;
      }
    },

    handleCookTouchEnd(event) {
      if (this.cookTouchStartX == null || this.cookTouchStartY == null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - this.cookTouchStartX;
      const deltaY = touch.clientY - this.cookTouchStartY;
      const wasScrolling = this.cookTouchScrolling;
      const wasSwipeActive = this.cookSwipeActive;
      this.cookTouchStartX = null;
      this.cookTouchStartY = null;
      this.cookTouchScrolling = false;

      if (this.cookSwipeAnimating) return;

      if (wasSwipeActive && this.isCookMobileView() && !wasScrolling) {
        const threshold = 60;
        if (this.cookSwipeOffset < -threshold) this.commitCookSwipe('next');
        else if (this.cookSwipeOffset > threshold) this.commitCookSwipe('prev');
        else this.resetCookSwipe(true);
        return;
      }

      if (wasScrolling) return;
      if (!this.isCookMobileView()) {
        if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        if (deltaX < 0) this.nextCookStep();
        else this.prevCookStep();
        return;
      }

      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        if (deltaX < 0) this.commitCookSwipe('next');
        else this.commitCookSwipe('prev');
      }
    },

    getCookSummaryChips() {
      const chips = [];
      if (this.hasVariants() && this.selectedVariation) {
        const variant = this.selectedRecipe.variants.find(v => v.key === this.selectedVariation);
        if (variant) chips.push(this.translateField(variant.name));
      }
      if (this.thermomixEnabled) chips.push(this.t('thermomix'));
      const title = this.getIngredientsSubtitle();
      if (title && title !== this.t('ingredients._')) chips.push(title);
      return chips;
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

    hasThermomixInstructions() {
      return this.thermomixAvailable;
    },

    toggleThermomix() {
      this.thermomixEnabled = !this.thermomixEnabled;
      const recipeName = this.getRecipeName();
      if (recipeName) {
        this.saveThermomixPreference(recipeName, this.thermomixEnabled);
      }
      if (this.cookMode) this.clampCookStepIndex();
      if (this.cookMode) this.scheduleCookMobileLayout();
      this.updateURL();
    },

    matchesInstructionMode(step, thermomixEnabled, usesInlineThermomix) {
      const modes = step.onlyForMode
        ? (Array.isArray(step.onlyForMode) ? step.onlyForMode : [step.onlyForMode])
        : null;

      if (thermomixEnabled) {
        if (modes && !modes.includes('thermomix')) return false;
        if (usesInlineThermomix && modes == null && !step.thermomix) return true;
        return true;
      }

      if (modes) return modes.includes('classic');
      if (usesInlineThermomix && step.thermomix && !step.text) return false;
      return true;
    },

    formatThermomixTime(seconds) {
      if (seconds == null) return '';
      if (seconds >= 60 && seconds % 60 === 0) {
        const minutes = seconds / 60;
        return `${minutes} ${this.t('thermomix_min')}`;
      }
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${minutes} ${this.t('thermomix_min')} ${remaining} ${this.t('thermomix_sec')}`;
      }
      return `${seconds} ${this.t('thermomix_sec')}`;
    },

    formatThermomixSettings(settings) {
      if (!settings) return [];
      const badges = [];
      if (settings.temperature != null) {
        badges.push(`${settings.temperature}°C`);
      }
      if (settings.time != null) {
        badges.push(this.formatThermomixTime(settings.time));
      }
      if (settings.speed != null) {
        badges.push(`${this.t('thermomix_speed')} ${settings.speed}`);
      }
      if (settings.rotation) {
        badges.push(this.t(`thermomix_rotation_${settings.rotation}`, settings.rotation));
      }
      if (settings.mode) {
        badges.push(this.t(`thermomix_mode_${settings.mode}`, settings.mode));
      }
      return badges;
    },

    mapInstructionStep(step, thermomixEnabled, usesInlineThermomix) {
      const inlineThermomix = usesInlineThermomix && thermomixEnabled && step.thermomix;
      const textSource = inlineThermomix && step.thermomix.text ? step.thermomix.text : step.text;
      const settings = inlineThermomix
        ? step.thermomix.settings
        : (thermomixEnabled ? step.settings : null);

      const ingredientIds = Array.isArray(step.ingredients) ? step.ingredients : null;

      return {
        text: this.translateField(textSource),
        image: step.image || null,
        settingsBadges: this.formatThermomixSettings(settings),
        ingredientIds
      };
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
          // Use original dimensions for baseline calculation
          if (!this.originalDimensions) return 1;
          
          // Calculate original area based on original shape
          let originalArea;
          if (this.originalShape === 'circular') {
            originalArea = Math.PI * Math.pow(this.originalDimensions.diameter / 2, 2);
          } else {
            originalArea = this.originalDimensions.width * this.originalDimensions.height;
          }
          
          // Calculate current area based on current shape (from portion.shape which may have changed)
          let currentArea;
          if (portion.shape === 'circular') {
            currentArea = Math.PI * Math.pow(this.currentDimensions.diameter / 2, 2);
          } else {
            currentArea = this.currentDimensions.width * this.currentDimensions.height;
          }
          
          return currentArea / originalArea;
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

    // 1. Helper function that ONLY calculates the "for 2 units / for 24 cm" part
    getIngredientsSubtitle() {
      if (!this.selectedRecipe) return '';

      const portion = this.selectedRecipe.portion;

      if (this.hasServings()) {
        const unit = portion?.unit || this.selectedRecipe.servings?.unit || 'servings';
        const unitText = this.t(`units.${unit}`);
        return `${this.currentServings} ${unitText}`;
      }

      if (this.hasUnits()) {
        const unit = portion?.unit || this.selectedRecipe.units?.unit || 'unit';
        const unitText = this.t(`units.${unit}`) || unit;
        return `${this.currentUnits} ${unitText}`;
      }

      if (this.hasCircularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        return `ø ${this.currentDimensions.diameter} ${unitText} 🍰`;
      }

      if (this.hasRectangularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        return `${this.currentDimensions.width}×${this.currentDimensions.height} ${unitText} 📐`;
      }

      if (this.hasDiameter()) {
        const unit = portion?.unit || this.selectedRecipe.diameter?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        const connector = this.t(`connectors.${unit}`);

        if (unit === 'cm') {
          return `ø ${this.currentDiameter} ${unitText} 🍰`;
        }
        return `${this.currentDiameter} ${connector} ${unitText}`;
      }

      return '';
    },

    // Returns portion label when adjustable, otherwise the generic "Ingredients" heading
    getIngredientsTitle() {
      const portionText = this.getIngredientsSubtitle();
      return portionText || this.t('ingredients._');
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
        // Use current shape (may have been changed by user)
        this.dimensionConfigShape = portion.shape;
        
        if (portion.shape === 'circular') {
          this.dimensionConfigDiameter = this.currentDimensions.diameter || (this.originalDimensions?.diameter || 15);
        } else {
          this.dimensionConfigWidth = this.currentDimensions.width || (this.originalDimensions?.width || 20);
          this.dimensionConfigHeight = this.currentDimensions.height || (this.originalDimensions?.height || 20);
        }
      }
      
      this.showDimensionConfig = true;
    },

    setAreaShape(shape) {
      this.dimensionConfigShape = shape;
      
      // Auto-adjust dimensions when switching shapes based on current area
      if (shape === 'circular') {
        // Convert rectangular to circular area: estimate diameter from area
        // Use current dimensions if available, otherwise use config dimensions
        const width = this.currentDimensions.width || this.dimensionConfigWidth;
        const height = this.currentDimensions.height || this.dimensionConfigHeight;
        const area = width * height;
        this.dimensionConfigDiameter = Math.round(Math.sqrt(area / Math.PI) * 2);
      } else {
        // Convert circular to rectangular area: estimate sides from area
        // Use current diameter if available, otherwise use config diameter
        const diameter = this.currentDimensions.diameter || this.dimensionConfigDiameter;
        const area = Math.PI * Math.pow(diameter / 2, 2);
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
        // Update the portion's shape (for UI display)
        portion.shape = this.dimensionConfigShape;
        
        // Update current dimensions (user's selection)
        if (this.dimensionConfigShape === 'circular') {
          this.currentDimensions.diameter = this.dimensionConfigDiameter;
        } else {
          this.currentDimensions.width = this.dimensionConfigWidth;
          this.currentDimensions.height = this.dimensionConfigHeight;
        }
        
        // Note: We do NOT update portion.dimensions or originalDimensions
        // The multiplier calculation uses originalDimensions as the baseline
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

    getCookIngredientsAt(index) {
      const step = this.getCookStepAt(index);
      if (!step?.ingredientIds?.length) return [];

      const idSet = new Set(step.ingredientIds);
      return this.currentIngredients()
        .map(group => ({
          ...group,
          items: group.items.filter(item => item.id && idSet.has(item.id))
        }))
        .filter(group => group.items.length > 0);
    },

    hasCookIngredientsAt(index) {
      return this.getCookIngredientsAt(index).length > 0;
    },

    currentCookIngredients() {
      return this.getCookIngredientsAt(this.cookStepIndex);
    },

    hasCookStepIngredients() {
      return this.hasCookIngredientsAt(this.cookStepIndex);
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
            id: e.id || null,
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
      const variationKey = this.selectedVariation;
      const thermomixEnabled = this.thermomixEnabled;
      const hasDedicatedThermomix = Array.isArray(this.selectedRecipe.instructionsThermomix)
        && this.selectedRecipe.instructionsThermomix.length > 0;
      const usesInlineThermomix = !hasDedicatedThermomix;
      const raw = thermomixEnabled && hasDedicatedThermomix
        ? this.selectedRecipe.instructionsThermomix
        : (this.selectedRecipe.instructions || []);

      return raw
        .filter(e => {
          if (e.onlyForVariation) {
            const allowed = Array.isArray(e.onlyForVariation) ? e.onlyForVariation : [e.onlyForVariation];
            if (!variationKey || !allowed.includes(variationKey)) return false;
          }
          return this.matchesInstructionMode(e, thermomixEnabled, usesInlineThermomix);
        })
        .map(e => this.mapInstructionStep(e, thermomixEnabled, usesInlineThermomix));
    },

    showQRCode() {
      this.showQRModal = true;
      this.urlCopied = false;
      
      // Generate QR code after modal is shown
      this.$nextTick(() => {
        const recipeUrl = window.location.href.split('#')[0] + window.location.hash;
        const qrElement = document.getElementById('qrcode');
        
        if (!qrElement) return;
        
        // Clear previous QR code
        qrElement.innerHTML = '';
        
        try {
          // Generate QR code with colors that match the current theme
          // In dark mode: white QR on dark background (gray-800)
          // In light mode: dark QR on light background (white)
          const colorDark = this.darkMode ? '#FFFFFF' : '#000000';
          const colorLight = this.darkMode ? '#1F2937' : '#FFFFFF'; // gray-800 for dark mode bg to match dialog
          
          // Generate new QR code using QRCode constructor
          new QRCode(qrElement, {
            text: recipeUrl,
            width: 256,
            height: 256,
            colorDark: colorDark,
            colorLight: colorLight,
            correctLevel: QRCode.CorrectLevel.H
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
          qrElement.innerHTML = '<p class="text-red-500">Error generating QR code</p>';
        }
      });
    },

    copyRecipeUrl() {
      const recipeUrl = window.location.href.split('#')[0] + window.location.hash;
      const recipeTitle = this.selectedRecipe ? this.translateField(this.selectedRecipe.title) : '';
      
      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        navigator.share({
          title: recipeTitle || 'Recipe',
          text: recipeTitle || 'Check out this recipe',
          url: recipeUrl
        }).then(() => {
          // Share was successful
          this.urlCopied = true;
          setTimeout(() => {
            this.urlCopied = false;
          }, 2000);
        }).catch(err => {
          // User cancelled or error occurred, fall back to clipboard
          if (err.name !== 'AbortError') {
            this.fallbackCopyToClipboard(recipeUrl);
          }
        });
      } else {
        // Fall back to clipboard copy for desktop
        this.fallbackCopyToClipboard(recipeUrl);
      }
    },

    fallbackCopyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.urlCopied = true;
          setTimeout(() => {
            this.urlCopied = false;
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy URL:', err);
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this.urlCopied = true;
          setTimeout(() => {
            this.urlCopied = false;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy URL:', err);
        }
        document.body.removeChild(textArea);
      }
    },

    canUseWebShare() {
      return navigator.share !== undefined;
    },
  };
}
