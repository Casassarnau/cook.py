function recipeInstructions() {
  return {
    currentInstructions() {
      const variationKey = this.selectedVariation;
      const thermomixEnabled = this.thermomixEnabled;
      const hasDedicatedThermomix =
        Array.isArray(this.selectedRecipe.instructionsThermomix) &&
        this.selectedRecipe.instructionsThermomix.length > 0;
      const usesInlineThermomix = !hasDedicatedThermomix;
      const raw =
        thermomixEnabled && hasDedicatedThermomix ?
        this.selectedRecipe.instructionsThermomix :
        this.selectedRecipe.instructions || [];

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
  };
}
