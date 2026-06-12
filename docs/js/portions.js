function recipePortions() {
  return {
    getMultiplier() {
      if (!this.selectedRecipe) return 1;

      if (this.selectedRecipe.portion) {
        const portion = this.selectedRecipe.portion;
        if (portion.type === 'servings') {
          return this.currentServings / portion.value;
        } else if (portion.type === 'units') {
          return this.currentUnits / portion.value;
        } else if (portion.type === 'area') {
          if (!this.originalDimensions) return 1;

          let originalArea;
          if (this.originalShape === 'circular') {
            originalArea = Math.PI * Math.pow(this.originalDimensions.diameter / 2, 2);
          } else {
            originalArea = this.originalDimensions.width * this.originalDimensions.height;
          }

          let currentArea;
          if (portion.shape === 'circular') {
            currentArea = Math.PI * Math.pow(this.currentDimensions.diameter / 2, 2);
          } else {
            currentArea = this.currentDimensions.width * this.currentDimensions.height;
          }

          return currentArea / originalArea;
        } else if (portion.type === 'diameter') {
          const originalDiameter = portion.value;
          return Math.pow(this.currentDiameter / originalDiameter, 2);
        }
      }

      if (this.selectedRecipe.servings) {
        return this.currentServings / this.selectedRecipe.servings.value;
      } else if (this.selectedRecipe.units) {
        return this.currentUnits / this.selectedRecipe.units.value;
      } else if (this.selectedRecipe.diameter) {
        const originalDiameter = this.selectedRecipe.diameter.value;
        return Math.pow(this.currentDiameter / originalDiameter, 2);
      }

      return 1;
    },

    hasServings() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'servings') return true;
      return !!this.selectedRecipe.servings;
    },

    hasArea() {
      if (!this.selectedRecipe) return false;
      return this.selectedRecipe.portion?.type === 'area';
    },

    hasCircularArea() {
      if (!this.selectedRecipe) return false;
      return this.selectedRecipe.portion?.type === 'area' && this.selectedRecipe.portion?.shape === 'circular';
    },

    hasRectangularArea() {
      if (!this.selectedRecipe) return false;
      return (
        this.selectedRecipe.portion?.type === 'area' &&
        (this.selectedRecipe.portion?.shape === 'rectangular' || this.selectedRecipe.portion?.shape === 'square')
      );
    },

    hasDiameter() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'diameter') return true;
      if (this.selectedRecipe.portion?.type === 'area' && this.selectedRecipe.portion?.shape === 'circular') return true;
      return !!this.selectedRecipe.diameter;
    },

    hasUnits() {
      if (!this.selectedRecipe) return false;
      if (this.selectedRecipe.portion?.type === 'units') return true;
      return !!this.selectedRecipe.units;
    },

    getIngredientsSubtitle() {
      if (!this.selectedRecipe) return '';

      const portion = this.selectedRecipe.portion;
      const forConnector = this.t('connectors.for');

      if (this.hasServings()) {
        const unit = portion?.unit || this.selectedRecipe.servings?.unit || 'servings';
        const unitText = this.t(`units.${unit}`);
        return `${forConnector} ${this.currentServings} ${unitText}`;
      }

      if (this.hasUnits()) {
        const unit = portion?.unit || this.selectedRecipe.units?.unit || 'unit';
        const unitText = this.t(`units.${unit}`) || unit;
        return `${forConnector} ${this.currentUnits} ${unitText}`;
      }

      if (this.hasCircularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        return `${forConnector} ø ${this.currentDimensions.diameter} ${unitText} 🍰`;
      }

      if (this.hasRectangularArea()) {
        const unit = portion?.dimensions?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        return `${forConnector} ${this.currentDimensions.width}×${this.currentDimensions.height} ${unitText} 📐`;
      }

      if (this.hasDiameter()) {
        const unit = portion?.unit || this.selectedRecipe.diameter?.unit || 'cm';
        const unitText = this.t(`units.${unit}`);
        const connector = this.t(`connectors.${unit}`);

        if (unit === 'cm') {
          return `${forConnector} ø ${this.currentDiameter} ${unitText} 🍰`;
        }
        return `${forConnector} ${this.currentDiameter} ${connector} ${unitText}`;
      }

      return '';
    },

    getPortionLabel() {
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

    getIngredientsTitle() {
      const ingredientsLabel = this.t('ingredients._');
      const portionText = this.getIngredientsSubtitle();
      return portionText ? `${ingredientsLabel} ${portionText}` : ingredientsLabel;
    },

    incrementDimensions() {
      if (this.hasCircularArea()) {
        this.currentDimensions.diameter += 1;
        this.saveServingsPreferences();
      } else if (this.hasRectangularArea()) {
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

      if (portion.type === 'area') {
        this.dimensionConfigShape = portion.shape;

        if (portion.shape === 'circular') {
          this.dimensionConfigDiameter =
            this.currentDimensions.diameter || this.originalDimensions?.diameter || 15;
        } else {
          this.dimensionConfigWidth = this.currentDimensions.width || this.originalDimensions?.width || 20;
          this.dimensionConfigHeight = this.currentDimensions.height || this.originalDimensions?.height || 20;
        }
      }

      this.showDimensionConfig = true;
    },

    setAreaShape(shape) {
      this.dimensionConfigShape = shape;

      if (shape === 'circular') {
        const width = this.currentDimensions.width || this.dimensionConfigWidth;
        const height = this.currentDimensions.height || this.dimensionConfigHeight;
        const area = width * height;
        this.dimensionConfigDiameter = Math.round(Math.sqrt(area / Math.PI) * 2);
      } else {
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
        portion.shape = this.dimensionConfigShape;

        if (this.dimensionConfigShape === 'circular') {
          this.currentDimensions.diameter = this.dimensionConfigDiameter;
        } else {
          this.currentDimensions.width = this.dimensionConfigWidth;
          this.currentDimensions.height = this.dimensionConfigHeight;
        }
      }

      this.saveServingsPreferences();
      this.showDimensionConfig = false;
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
  };
}
