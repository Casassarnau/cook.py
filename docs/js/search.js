function recipeSearch() {
  const HOME_FILTERS_KEY = 'homeFilters';

  return {
    loadHomeFilters() {
      try {
        const saved = sessionStorage.getItem(HOME_FILTERS_KEY);
        if (!saved) return;

        const prefs = JSON.parse(saved);
        if (typeof prefs.searchQuery === 'string') this.searchQuery = prefs.searchQuery;
        if (typeof prefs.filterCategory === 'string') this.filterCategory = prefs.filterCategory;
      } catch (e) {
        console.error('Failed to parse home filters:', e);
      }
    },

    saveHomeFilters() {
      sessionStorage.setItem(HOME_FILTERS_KEY, JSON.stringify({
        searchQuery: this.searchQuery,
        filterCategory: this.filterCategory,
      }));
    },

    isIngredientSearch(query) {
      const prefix = this.t('ingredients._') + ':';
      return query.toLowerCase().startsWith(prefix.toLowerCase());
    },

    getSearchTerms(query) {
      if (this.isIngredientSearch(query)) {
        const colonIndex = query.indexOf(':');
        const searchPart = colonIndex !== -1 ? query.substring(colonIndex + 1).trim() : query;
        return searchPart.split(',').map(term => term.trim()).filter(term => term.length > 0);
      }
      return query.split(',').map(term => term.trim()).filter(term => term.length > 0);
    },

    matchesSearchTerms(recipe, searchTerms, isIngredientSearch) {
      if (isIngredientSearch) {
        const ingredientKeys = recipe.ingredient_keys || [];
        const ingredientNames = ingredientKeys.flatMap(key => this.ingredientSearchNames(key));
        return searchTerms.every(term =>
          ingredientNames.some(key =>
            this.normalizeText(key).includes(this.normalizeText(term))
          )
        );
      }

      const title = this.translateField(recipe.title);
      return searchTerms.some(term =>
        this.normalizeText(title).includes(this.normalizeText(term))
      );
    },

    filteredCards() {
      return this.index.filter(i => {
        let matchSearch = true;
        if (this.searchQuery.trim()) {
          const isIngredientSearch = this.isIngredientSearch(this.searchQuery);
          const searchTerms = this.getSearchTerms(this.searchQuery);
          matchSearch = this.matchesSearchTerms(i, searchTerms, isIngredientSearch);
        }

        const cats = i.categories || [];
        const matchCat = this.filterCategory ? cats.includes(this.filterCategory) : true;

        return matchSearch && matchCat;
      });
    },
  };
}
