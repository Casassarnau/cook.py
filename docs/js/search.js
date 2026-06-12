function recipeSearch() {
  return {
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
        const ingredientNames = ingredientKeys.flatMap(key => {
          const names = [this.t(`ingredients.${key}`)];
          const singular = this.t(`ingredients.${key}_single`, null);
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
