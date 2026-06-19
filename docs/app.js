function recipeApp() {
  return Object.assign({},
    recipeAppState(),
    recipeUtils(),
    recipeI18n(),
    recipeTheme(),
    recipeSearch(),
    recipeData(),
    recipePreferences(),
    recipeRouting(),
    recipePortions(),
    recipeIngredients(),
    recipeVariants(),
    recipeThermomix(),
    recipeInstructions(),
    recipeCookMode(),
    recipeSharing(), {
      async init() {
        this.basePath =
          location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? '' : '/cook.py';
        const savedTheme = localStorage.getItem('theme');
        this.darkMode = savedTheme ? savedTheme === 'dark' : false;
        document.documentElement.classList.toggle('dark', this.darkMode);
        this.lang = localStorage.getItem('lang') || 'en';
        this.$watch('lang', v => {
          localStorage.setItem('lang', v);
          this.loadTranslations();
        });

        this.loadHomeFilters();

        await this.loadTranslations();
        await this.loadEmojis();
        await this.loadIndex();

        if (this.filterCategory && !this.categories.includes(this.filterCategory)) {
          this.filterCategory = '';
        }

        this.$watch('searchQuery', () => this.saveHomeFilters());
        this.$watch('filterCategory', () => this.saveHomeFilters());

        window.addEventListener('hashchange', () => this.handleRoute());
        await this.handleRoute();
        this.finishRoutePending();
        document.documentElement.classList.remove('app-loading');
      },
    }
  );
}
