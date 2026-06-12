const COOK_SLIDE_MS = 320;

function recipeCookMode() {
  return {
    cookStepStorageKey(recipeName) {
      return `cookProgress_${recipeName}`;
    },

    loadCookStepIndex(recipeName) {
      const saved = sessionStorage.getItem(this.cookStepStorageKey(recipeName));
      if (saved == null) return 0;
      const index = parseInt(saved, 10);
      return Number.isFinite(index) && index >= 0 ? index : 0;
    },

    saveCookStepIndex(recipeName, index) {
      sessionStorage.setItem(this.cookStepStorageKey(recipeName), String(index));
    },

    clampCookStepIndex() {
      const count = this.cookStepCount();
      if (count === 0) {
        this.cookStepIndex = 0;
        return;
      }
      this.cookStepIndex = Math.max(0, Math.min(this.cookStepIndex, count - 1));
    },

    cookStepCount() {
      return this.currentInstructions().length;
    },

    currentCookStep() {
      const steps = this.currentInstructions();
      return steps[this.cookStepIndex] || null;
    },

    getCookStepAt(index) {
      const steps = this.currentInstructions();
      return steps[index] ?? null;
    },

    cookSwipePreviewStepIndex() {
      if (this.cookAnimPreviewIndex != null) return this.cookAnimPreviewIndex;
      if (!this.cookSwipeActive) return null;
      if (this.cookSwipeOffset > 0 && this.cookStepIndex > 0) return this.cookStepIndex - 1;
      if (this.cookSwipeOffset < 0 && this.cookStepIndex < this.cookStepCount() - 1) return this.cookStepIndex + 1;
      return null;
    },

    showCookSwipePreview() {
      if (!this.isCookMobileView()) return false;
      return this.cookSwipePreviewStepIndex() != null && (this.cookSwipeActive || this.cookSwipeAnimating);
    },

    formatCookStepLabel() {
      const current = this.cookStepIndex + 1;
      const total = this.cookStepCount();
      return `${this.t('cook_step')} ${current} ${this.t('cook_of')} ${total}`;
    },

    cookProgressPercent() {
      const total = this.cookStepCount();
      if (total <= 1) return 100;
      return (this.cookStepIndex / (total - 1)) * 100;
    },

    cookStepPanelOverflowClass() {
      return this.cookStepContentOverflows ? ' overflow-y-auto' : ' overflow-hidden';
    },

    scheduleCookMobileLayout(enableTransition = true) {
      if (!this.cookMode || !this.isCookMobileView()) return;
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.updateCookMobileLayout(enableTransition);
        });
      });
    },

    updateCookMobileLayout() {
      if (!this.cookMode || !this.isCookMobileView()) {
        this.cookLayoutStepHeight = null;
        this.cookLayoutIngredientsHeight = null;
        this.cookLayoutTransitionEnabled = false;
        this.cookStepContentOverflows = false;
        return;
      }

      const stack = document.getElementById('cook-mobile-stack');
      const measureEl = document.getElementById('cook-step-measure');
      if (!stack || !measureEl) return;

      this.cookLayoutStepHeight = null;
      this.cookLayoutIngredientsHeight = null;
      this.cookLayoutTransitionEnabled = false;
      const panelPaddingY = 32;
      this.cookStepContentOverflows = measureEl.offsetHeight + panelPaddingY > stack.clientHeight;
    },

    cookStepPanelLayoutStyle() {
      return '';
    },

    cookMobileLayoutPanelClass() {
      return '';
    },

    bindCookMobileLayoutListeners() {
      if (this.cookLayoutResizeHandler) return;
      this.cookLayoutResizeHandler = () => this.scheduleCookMobileLayout();
      window.addEventListener('resize', this.cookLayoutResizeHandler);
      window.visualViewport?.addEventListener('resize', this.cookLayoutResizeHandler);
    },

    unbindCookMobileLayoutListeners() {
      if (!this.cookLayoutResizeHandler) return;
      window.removeEventListener('resize', this.cookLayoutResizeHandler);
      window.visualViewport?.removeEventListener('resize', this.cookLayoutResizeHandler);
      this.cookLayoutResizeHandler = null;
    },

    resetCookMobileLayout() {
      this.cookLayoutStepHeight = null;
      this.cookLayoutIngredientsHeight = null;
      this.cookLayoutTransitionEnabled = false;
      this.cookStepContentOverflows = false;
      this.unbindCookMobileLayoutListeners();
    },

    enterCookMode() {
      const recipeName = this.getRecipeName();
      if (!recipeName || this.cookStepCount() === 0) return;
      this.cookStepIndex = this.loadCookStepIndex(recipeName);
      this.clampCookStepIndex();
      this.resetCookSwipe();
      this.cookMode = true;
      document.body.classList.add('overflow-hidden');
      this.bindCookMobileLayoutListeners();
      this.scheduleCookMobileLayout(false);
      this.updateURL();
    },

    exitCookMode(updateUrl = true) {
      this.cookMode = false;
      this.resetCookSwipe();
      this.resetCookMobileLayout();
      this.showCookAdjustModal = false;
      document.body.classList.remove('overflow-hidden');
      if (updateUrl) this.updateURL();
    },

    goToCookStep(index, options = {}) {
      const count = this.cookStepCount();
      if (count === 0) return;
      this.cookStepIndex = Math.max(0, Math.min(index, count - 1));
      if (!options.skipPersist) {
        const recipeName = this.getRecipeName();
        if (recipeName) this.saveCookStepIndex(recipeName, this.cookStepIndex);
        this.updateURL();
      }
      if (!options.skipLayout) {
        this.scheduleCookMobileLayout();
      }
    },

    isCookMobileView() {
      return window.matchMedia('(max-width: 767px)').matches;
    },

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    cookStepTransformStyle() {
      if (!this.isCookMobileView()) return '';
      return `transform: translateX(${this.cookSwipeOffset}px)`;
    },

    cookStepSlideClass() {
      if (!this.isCookMobileView()) return '';
      return this.cookSwipeTransition ? 'cook-step-slide-transition' : '';
    },

    cookPreviewTransformStyle() {
      if (!this.isCookMobileView()) return '';
      const width = this.getCookStepPanelWidth();
      if (this.cookAnimPreviewIndex != null) {
        return `transform: translateX(${this.cookPreviewOffset}px)`;
      }
      if (this.cookSwipeOffset > 0) {
        return `transform: translateX(${-width + this.cookSwipeOffset}px)`;
      }
      if (this.cookSwipeOffset < 0) {
        return `transform: translateX(${width + this.cookSwipeOffset}px)`;
      }
      return '';
    },

    cookPreviewSlideClass() {
      if (!this.isCookMobileView()) return '';
      return this.cookPreviewTransition ? 'cook-step-slide-transition' : '';
    },

    cookPreviewLayerStyle() {
      if (!this.isCookMobileView()) return 'visibility: hidden';
      const visible = this.showCookSwipePreview();
      const transform = this.cookPreviewTransformStyle();
      const vis = visible ? 'visible' : 'hidden';
      return transform ? `${transform}; visibility: ${vis}` : `visibility: ${vis}`;
    },

    resetCookSwipe(animated = false) {
      this.cookSwipeActive = false;
      this.cookAnimPreviewIndex = null;
      this.cookPreviewOffset = 0;
      this.cookPreviewTransition = false;
      if (animated) {
        this.cookSwipeTransition = true;
        this.cookSwipeOffset = 0;
        setTimeout(() => {
          this.cookSwipeTransition = false;
        }, COOK_SLIDE_MS);
      } else {
        this.cookSwipeTransition = false;
        this.cookSwipeOffset = 0;
      }
    },

    getCookStepPanelWidth() {
      const panel = document.getElementById('cook-step-panel');
      const width = panel ? panel.offsetWidth : 0;
      return width > 0 ? width : window.innerWidth;
    },

    finishCookSwipeCommit(targetIndex) {
      this.goToCookStep(targetIndex, { skipLayout: true });
      this.cookAnimPreviewIndex = null;
      this.cookPreviewOffset = 0;
      this.cookSwipeOffset = 0;
      this.cookSwipeTransition = false;
      this.cookPreviewTransition = false;
      this.cookSwipeAnimating = false;
      this.cookSwipeActive = false;
      this.scheduleCookMobileLayout();
    },

    commitCookSwipe(direction) {
      if (this.cookSwipeAnimating) return;
      const count = this.cookStepCount();
      const isPrev = direction === 'prev';
      const targetIndex = this.cookStepIndex + (isPrev ? -1 : 1);
      if (targetIndex < 0 || targetIndex >= count) {
        this.resetCookSwipe(true);
        return;
      }

      if (!this.isCookMobileView() || this.prefersReducedMotion()) {
        this.goToCookStep(targetIndex);
        this.resetCookSwipe();
        return;
      }

      const width = this.getCookStepPanelWidth();
      const startOffset = this.cookSwipeOffset;

      this.cookSwipeAnimating = true;
      this.cookAnimPreviewIndex = targetIndex;
      this.cookSwipeTransition = false;
      this.cookPreviewTransition = false;

      if (isPrev) {
        this.cookPreviewOffset = -width + startOffset;
      } else {
        this.cookPreviewOffset = width + startOffset;
      }

      // Paint the start frame, then enable transition, then animate to the end frame.
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.cookSwipeTransition = true;
          this.cookPreviewTransition = true;
          requestAnimationFrame(() => {
            this.cookSwipeOffset = isPrev ? width : -width;
            this.cookPreviewOffset = 0;
          });
        });
      });

      setTimeout(() => this.finishCookSwipeCommit(targetIndex), COOK_SLIDE_MS);
    },

    nextCookStep() {
      if (this.cookSwipeAnimating || this.cookStepIndex >= this.cookStepCount() - 1) return;
      if (this.isCookMobileView()) this.commitCookSwipe('next');
      else this.goToCookStep(this.cookStepIndex + 1);
    },

    prevCookStep() {
      if (this.cookSwipeAnimating || this.cookStepIndex <= 0) return;
      if (this.isCookMobileView()) this.commitCookSwipe('prev');
      else this.goToCookStep(this.cookStepIndex - 1);
    },

    handleCookKeydown(event) {
      if (!this.cookMode || this.showCookAdjustModal) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.nextCookStep();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.prevCookStep();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.exitCookMode();
      }
    },

    handleCookTouchStart(event) {
      if (this.cookSwipeAnimating) return;
      const touch = event.touches[0];
      if (!touch) return;
      this.cookTouchStartX = touch.clientX;
      this.cookTouchStartY = touch.clientY;
      this.cookTouchScrolling = false;
      this.cookSwipeActive = false;
    },

    handleCookTouchMove(event) {
      if (this.cookSwipeAnimating || this.cookTouchStartX == null || this.cookTouchStartY == null) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - this.cookTouchStartX;
      const deltaY = touch.clientY - this.cookTouchStartY;

      if (!this.cookSwipeActive && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        this.cookTouchScrolling = true;
        return;
      }

      if (!this.isCookMobileView() || this.cookTouchScrolling) return;

      if (Math.abs(deltaX) > 10) {
        if (event.cancelable) event.preventDefault();
        this.cookSwipeActive = true;
        this.cookSwipeTransition = false;
        let offset = deltaX;
        if (offset > 0 && this.cookStepIndex === 0) offset *= 0.35;
        if (offset < 0 && this.cookStepIndex >= this.cookStepCount() - 1) offset *= 0.35;
        this.cookSwipeOffset = offset;
      }
    },

    handleCookTouchEnd(event) {
      if (this.cookTouchStartX == null || this.cookTouchStartY == null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - this.cookTouchStartX;
      const deltaY = touch.clientY - this.cookTouchStartY;
      const wasScrolling = this.cookTouchScrolling;
      const wasSwipeActive = this.cookSwipeActive;
      this.cookTouchStartX = null;
      this.cookTouchStartY = null;
      this.cookTouchScrolling = false;

      if (this.cookSwipeAnimating) return;

      if (wasSwipeActive && this.isCookMobileView() && !wasScrolling) {
        const threshold = 60;
        if (this.cookSwipeOffset < -threshold) this.commitCookSwipe('next');
        else if (this.cookSwipeOffset > threshold) this.commitCookSwipe('prev');
        else this.resetCookSwipe(true);
        return;
      }

      if (wasScrolling) return;
      if (!this.isCookMobileView()) {
        if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        if (deltaX < 0) this.nextCookStep();
        else this.prevCookStep();
        return;
      }

      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        if (deltaX < 0) this.commitCookSwipe('next');
        else this.commitCookSwipe('prev');
      }
    },

    getCookSummaryChips() {
      const chips = [];
      if (this.hasVariants() && this.selectedVariation) {
        const variant = this.selectedRecipe.variants.find(v => v.key === this.selectedVariation);
        if (variant) chips.push(this.translateField(variant.name));
      }
      if (this.thermomixEnabled) chips.push(this.t('thermomix'));
      const title = this.getIngredientsSubtitle();
      if (title && title !== this.t('ingredients._')) chips.push(title);
      return chips;
    },
  };
}
