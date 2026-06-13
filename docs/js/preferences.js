function recipePreferences() {
  return {
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
            this.currentDimensions = {
              diameter: dims.diameter || 15
            };
          } else {
            this.currentDimensions = {
              width: dims.width || 20,
              height: dims.height || 20,
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
          if (prefs.dimensions) this.currentDimensions = {
            ...prefs.dimensions
          };
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
        prefs.dimensions = {
          ...this.currentDimensions
        };
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
  };
}
