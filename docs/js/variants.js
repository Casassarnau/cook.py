function recipeVariants() {
  return {
    hasVariants() {
      const r = this.selectedRecipe;
      return r && Array.isArray(r.variants) && r.variants.length > 0;
    },
  };
}
