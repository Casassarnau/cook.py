function recipeIngredients() {
  return {
    pluralizeIngredient(ingredientKey, value, unit) {
      return this.ingredientName(ingredientKey, value, unit);
    },

    currentIngredients() {
      const raw = this.selectedRecipe.ingredients || [];
      const variationKey = this.selectedVariation;
      const multiplier = this.getMultiplier();

      if (raw.length > 0 && raw[0].group) {
        return raw.map(group => ({
          isGroup: true,
          groupName: this.translateField(group.group),
          items: this.processIngredientList(group.items || [], variationKey, multiplier),
        }));
      }

      return [{
        isGroup: false,
        groupName: null,
        items: this.processIngredientList(raw, variationKey, multiplier),
      }, ];
    },

    getCookIngredientsAt(index) {
      const step = this.getCookStepAt(index);
      if (!step?.ingredientIds?.length) return [];

      const idSet = new Set(step.ingredientIds);
      return this.currentIngredients()
        .map(group => ({
          ...group,
          items: group.items.filter(item => item.id && idSet.has(item.id)),
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
            ingredientName = this.ingredientName(e.ingredient);
          } else {
            const calculatedValue = e.value * multiplier;
            displayValue = this.formatValue(calculatedValue);
            displayUnit = unit;
            displayConnector = connector;
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
            text: text,
          };
        });
    },
  };
}
