function recipeRouting() {
  return {
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

    getRecipeName() {
      if (!this.selectedRecipe) return null;

      const hash = location.hash;
      if (hash && hash.startsWith('#recipe=')) {
        const params = new URLSearchParams(hash.substring(1));
        const recipe = params.get('recipe');
        if (recipe) return recipe;
      }

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

    goHome() {
      if (this.cookMode) this.exitCookMode(false);
      location.hash = '';
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

            if (variantKey) {
              this.selectedVariation = variantKey;
              this.saveVariantPreference(recipeName, variantKey);
            } else {
              const variantPrefs = JSON.parse(localStorage.getItem('variantPreferences') || '{}');
              const savedVariant = variantPrefs[recipeName];
              if (savedVariant) {
                this.selectedVariation = savedVariant;
              } else if (this.selectedRecipe.variants && this.selectedRecipe.variants.length > 0) {
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
  };
}
