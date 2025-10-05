function recipeApp() {
  return {
    index: [],
    recipesCache: {},
    categories: [],
    searchQuery: '',
    filterCategory: '',
    selectedRecipe: null,
    selectedVariationIndex: 0,
    lang: 'en',
    translations: {},
    darkMode: false,
    basePath: '',

    async init() {
      // Determine base path: empty on localhost, '/recipes.py' elsewhere
      this.basePath = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '' : '/recipes.py';

      // Load saved theme ('dark' | 'light') and apply
      const savedTheme = localStorage.getItem('theme');
      this.darkMode = savedTheme ? savedTheme === 'dark' : false;
      document.documentElement.classList.toggle('dark', this.darkMode);

      // Initialize language from local storage and keep it in sync
      this.lang = localStorage.getItem('lang') || 'en';
      this.$watch('lang', value => {
        localStorage.setItem('lang', value);
        // Reload translations when language changes
        this.loadTranslations();
      });

      await this.loadTranslations();
      await this.loadIndex();

      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();
    },

    withBase(path) {
      if (!path) return path;
      const base = this.basePath.replace(/\/$/, '');
      const p = String(path).replace(/^\//, '');
      return base ? `${base}/${p}` : p;
    },

    async loadTranslations() {
      try {
        const res = await fetch(this.withBase(`translations/${this.lang}.json`));
        this.translations = await res.json();
      } catch {
        console.warn('No translation file found for', this.lang);
      }
    },

    async loadIndex() {
      const res = await fetch(this.withBase('index.json'));
      this.index = await res.json();
      // Gather unique categories from items that may include multiple categories
      const allCategories = this.index.flatMap(i => i.categories || []);
      this.categories = [...new Set(allCategories)];
    },

    async fetchRecipeBySlug(slug) {
      // Find the index item by slug of its title
      const item = this.index.find(i => this.slugify(i.title) === slug);
      if (!item) return null;

      // Use in-memory cache by path
      if (this.recipesCache[item.path]) {
        return this.recipesCache[item.path];
      }

      const res = await fetch(this.withBase(item.path));
      const data = await res.json();
      this.recipesCache[item.path] = data;
      return data;
    },

    t(key) {
      // Support nested translation keys like "group.subkey"
      const value = key.split('.').reduce((acc, part) => {
        if (acc === undefined || acc === null) return undefined;
        return acc[part];
      }, this.translations);
      return value !== undefined ? value : key;
    },

    translateField(field) {
      if (typeof field === 'string') return field;
      return field[this.lang] || field['en'];
    },

    translateFieldToLang(field, lang) {
      if (typeof field === 'string') return field;
      return (field && field[lang]) || (field && field['en']);
    },

    filteredCards() {
      // Filter using index items (no translations here, title is a string)
      return this.index.filter(i => {
        const title = (i.title || '').toLowerCase();
        const matchSearch = title.includes(this.searchQuery.toLowerCase());
        const cats = i.categories || [];
        const matchCat = this.filterCategory ? cats.includes(this.filterCategory) : true;
        return matchSearch && matchCat;
      });
    },

    slugify(text) {
      return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    },

    async handleRoute() {
      const hash = location.hash;
      if (hash.startsWith('#/recipe/')) {
        const slug = hash.replace('#/recipe/', '');
        const recipe = await this.fetchRecipeBySlug(slug);
        this.selectedRecipe = recipe || null;
        this.selectedVariationIndex = 0;
      } else {
        this.selectedRecipe = null;
      }
    },

    goHome() {
      location.hash = '#/';
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', this.darkMode);
    },

    hasIngredientVariations() {
      const r = this.selectedRecipe;
      return r && Array.isArray(r.ingredientVariations) && r.ingredientVariations.length > 0;
    },

    variationNames() {
      if (!this.hasIngredientVariations()) return [];
      return this.selectedRecipe.ingredientVariations.map(v => this.translateField(v.name));
    },


    currentIngredientsAll() {
      if (this.hasIngredientVariations()) {
        const v = this.selectedRecipe.ingredientVariations[this.selectedVariationIndex] || this.selectedRecipe.ingredientVariations[0];
        return v.ingredients || [];
      }
      return this.selectedRecipe.ingredients || [];
    },

    currentIngredients() {
      if (this.hasIngredientVariations()) {
        const v = this.selectedRecipe.ingredientVariations[this.selectedVariationIndex] || this.selectedRecipe.ingredientVariations[0];
        return this.translateField(v.ingredients) || [];
      }
      return this.translateField(this.selectedRecipe.ingredients) || [];
    },

    selectedVariationKey() {
      if (!this.hasIngredientVariations()) return undefined;
      const v = this.selectedRecipe.ingredientVariations[this.selectedVariationIndex] || this.selectedRecipe.ingredientVariations[0];
      return v.key;
    },

    normalizeInstructionEntry(entry) {
      // Accept plain string or object { text: localizedStringOrObject, onlyForVariation?: string | string[] }
      if (typeof entry === 'string') {
        return { text: entry };
      }
      return entry || {};
    },

    currentInstructions() {
      const raw = this.translateField(this.selectedRecipe.instructions) || [];
      // raw might be an array of strings or an array of objects with localizable text
      const variationKey = this.selectedVariationKey();
      return raw
        .map(e => this.normalizeInstructionEntry(e))
        .filter(e => {
          if (!e.onlyForVariation) return true;
          const allowed = Array.isArray(e.onlyForVariation) ? e.onlyForVariation : [e.onlyForVariation];
          return variationKey && allowed.includes(variationKey);
        })
        .map(e => this.translateField(e.text ?? e));
    },

    ingredientIcon(text) {
      const t = String(text || '').toLowerCase();
      const rules = [
        // Fruits
        [/grape|grapes/, '🍇'],
        [/melon\b|honeydew/, '🍈'],
        [/watermelon/, '🍉'],
        [/orange|mandarin|clementine|tangerine/, '🍊'],
        [/lemon/, '🍋'],
        [/lime/, '🍋‍🟩'],
        [/banana/, '🍌'],
        [/pineapple/, '🍍'],
        [/mango/, '🥭'],
        [/\bred\s*apple|apple(?!\s*sauce|\s*cider)/, '🍎'],
        [/\bgreen\s*apple/, '🍏'],
        [/pear/, '🍐'],
        [/peach/, '🍑'],
        [/cherry|cherries/, '🍒'],
        [/strawberry|strawberries/, '🍓'],
        [/blueberry|blueberries/, '🫐'],
        [/kiwi/, '🥝'],
        [/tomato/, '🍅'],
        [/olive|olives/, '🫒'],
        [/coconut/, '🥥'],

        // Vegetables, legumes, nuts
        [/avocado/, '🥑'],
        [/eggplant|aubergine/, '🍆'],
        [/potato|potatoes/, '🥔'],
        [/carrot|carrots/, '🥕'],
        [/corn|maize|sweet\s*corn/, '🌽'],
        [/pepper\b.*bell|bell\s*pepper|capsicum|pepper\s*(red|green|yellow)/, '🫑'],
        [/chili|chilli|chile/, '🌶️'],
        [/cucumber|gherkin/, '🥒'],
        [/lettuce|greens|leafy\s*greens|cabbage|bok\s*choy|spinach/, '🥬'],
        [/broccoli/, '🥦'],
        [/garlic/, '🧄'],
        [/onion|shallot|spring\s*onion|scallion/, '🧅'],
        [/peanut|peanuts/, '🥜'],
        [/bean|beans|lentil|lentils|legume|legumes/, '🫘'],
        [/chestnut|chestnuts/, '🌰'],
        [/ginger/, '🫚'],
        [/pea|peas|snow\s*pea|snap\s*pea|edamame/, '🫛'],
        [/cashew|cashews|almond|almonds|pistachio|pistachios|walnut|walnuts|hazelnut|hazelnuts/, '🫜'],
        [/mushroom|porcini|shiitake|button\s*mushroom/, '🍄‍🟫'],

        // Prepared foods
        [/bread|loaf|toast/, '🍞'],
        [/croissant/, '🥐'],
        [/baguette/, '🥖'],
        [/flatbread|pita|naan|roti|chapati/, '🫓'],
        [/pretzel/, '🥨'],
        [/bagel/, '🥯'],
        [/pancake|pancakes/, '🥞'],
        [/waffle|waffles/, '🧇'],
        [/cheese|parmesan|mozzarella|cheddar|gouda|brie|feta|roquefort|gorgonzola|ricotta/, '🧀'],
        [/ham\b|ribs|pork\s*shoulder/, '🍖'],
        [/chicken\s*leg|drumstick/, '🍗'],
        [/beef|steak|sirloin|ribeye/, '🥩'],
        [/bacon|pancetta/, '🥓'],
        [/burger|hamburger/, '🍔'],
        [/fries|chips\b(?!\s*and)/, '🍟'],
        [/pizza/, '🍕'],
        [/hot\s*dog/, '🌭'],
        [/sandwich/, '🥪'],
        [/taco/, '🌮'],
        [/burrito/, '🌯'],
        [/tamale|tamales/, '🫔'],
        [/kebab|shawarma|gyro|wrap/, '🥙'],
        [/falafel|meatball|kofta/, '🧆'],
        [/egg|eggs?\b/, '🥚'],
        [/fried\s*egg|frying\s*pan/, '🍳'],
        [/paella|casserole|stew\b.*pan/, '🥘'],
        [/stew|soup\b(?!\s*stock)|hotpot/, '🍲'],
        [/fondue|cheese\s*fondue/, '🫕'],
        [/bowl\s*with\s*spoon|porridge|oatmeal/, '🥣'],
        [/salad|greens\s*salad/, '🥗'],
        [/popcorn/, '🍿'],
        [/butter/, '🧈'],
        [/\bsalt\b/, '🧂'],
        [/canned|tin\s*can/, '🥫'],
        [/pasta|spaghetti|noodles?/, '🍝'],

        // Asian foods
        [/bento/, '🍱'],
        [/rice\s*cracker/, '🍘'],
        [/rice\s*ball|onigiri/, '🍙'],
        [/cooked\s*rice|steamed\s*rice/, '🍚'],
        [/curry/, '🍛'],
        [/ramen|noodle\s*soup|pho|udon|soba|laksa/, '🍜'],
        [/sweet\s*potato|yakiimo/, '🍠'],
        [/oden/, '🍢'],
        [/sushi/, '🍣'],
        [/shrimp\s*tempura|tempura/, '🍤'],
        [/fish\s*cake|narutomaki|kamaboko/, '🍥'],
        [/mooncake/, '🥮'],
        [/dango/, '🍡'],
        [/dumpling|gyoza|jiaozi|pierogi|momo/, '🥟'],
        [/fortune\s*cookie/, '🥠'],
        [/take\s*out|takeaway|takeout\s*box/, '🥡'],

        // Sweets & desserts
        [/soft\s*serve|ice\s*cream\s*cone/, '🍦'],
        [/shaved\s*ice/, '🍧'],
        [/ice\s*cream(?!\s*cone)/, '🍨'],
        [/donut|doughnut/, '🍩'],
        [/cookie|biscuit/, '🍪'],
        [/birthday\s*cake/, '🎂'],
        [/cake|shortcake/, '🍰'],
        [/cupcake/, '🧁'],
        [/pie/, '🥧'],
        [/chocolate|cocoa/, '🍫'],
        [/candy/, '🍬'],
        [/lollipop/, '🍭'],
        [/custard|flan|crème\s*caramel|creme\s*caramel/, '🍮'],
        [/honey/, '🍯'],

        // Drinks & dishware
        [/baby\s*bottle|formula/, '🍼'],
        [/milk|cream\b/, '🥛'],
        [/coffee|espresso|latte|americano|cappuccino/, '☕'],
        [/teapot/, '🫖'],
        [/tea|matcha/, '🍵'],
        [/sake/, '🍶'],
        [/champagne\s*bottle|sparkling\s*wine/, '🍾'],
        [/wine/, '🍷'],
        [/martini|cocktail(?!\s*tropical)/, '🍸'],
        [/tropical\s*cocktail|piña\s*colada|pina\s*colada/, '🍹'],
        [/beer\b(?!\s*mug)|lager|ale|stout/, '🍺'],
        [/beers|clinking\s*beer/, '🍻'],
        [/clinking\s*glasses|cheers/, '🥂'],
        [/whiskey|whisky|bourbon|rum|vodka|brandy/, '🥃'],
        [/pouring|liquid\s*pour/, '🫗'],
        [/soda|soft\s*drink|cola|cup\s*with\s*straw/, '🥤'],
        [/bubble\s*tea|boba/, '🧋'],
        [/juice\s*box/, '🧃'],
        [/mate/, '🧉'],
        [/chopsticks/, '🥢'],
        [/plate|place\s*setting/, '🍽️'],
        [/fork|knife|cutlery/, '🍴'],
        [/spoon/, '🥄'],
        [/chef\s*knife|kitchen\s*knife/, '🔪'],
        [/jar|mason\s*jar|container/, '🫙'],
        [/amphora|urn/, '🏺'],

        // Staples & baking basics
        [/flour|all[-\s]?purpose|ap\s*flour|bread\s*flour|cake\s*flour/, '🌾'],
        [/yeast/, '🍞'],
        [/baking\s*powder/, '🎂'],
        [/baking\s*soda|bicarbonate/, '🧪'],
        [/(?:brown\s+)?sugar|caster\s*sugar|icing\s*sugar|powdered\s*sugar|confectioners'\s*sugar/, '🍬'],
        [/vanilla/, '🌼'],
        [/olive\s*oil/, '🫒'],
        [/\boil\b|vegetable\s*oil|sunflower\s*oil|canola\s*oil|corn\s*oil|neutral\s*oil/, '🫗'],
        [/water/, '💧'],
        [/herb|basil|parsley|cilantro|coriander|thyme|rosemary|oregano|mint|dill|chive|tarragon|sage/, '🌿'],
        [/rice/, '🍚'],
        [/fish|salmon|tuna|cod|trout|mackerel|sardine/, '🐟'],
      ];
      for (const [regex, icon] of rules) {
        if (regex.test(t)) return icon;
      }
      return '•';
    }
  };
}
