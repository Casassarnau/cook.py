function recipeData() {
  return {
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
  };
}
