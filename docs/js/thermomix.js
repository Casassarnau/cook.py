function recipeThermomix() {
  return {
    hasThermomixInstructions() {
      return this.thermomixAvailable;
    },

    toggleThermomix() {
      this.thermomixEnabled = !this.thermomixEnabled;
      this.saveThermomixPreference(this.thermomixEnabled);
      if (this.cookMode) this.clampCookStepIndex();
      if (this.cookMode) this.scheduleCookMobileLayout();
      this.updateURL();
    },

    matchesInstructionMode(step, thermomixEnabled, usesInlineThermomix) {
      const modes = step.onlyForMode ?
        Array.isArray(step.onlyForMode) ?
        step.onlyForMode : [step.onlyForMode] :
        null;

      if (thermomixEnabled) {
        if (modes && !modes.includes('thermomix')) return false;
        if (usesInlineThermomix && modes == null && !step.thermomix) return true;
        return true;
      }

      if (modes) return modes.includes('classic');
      if (usesInlineThermomix && step.thermomix && !step.text) return false;
      return true;
    },

    formatThermomixTime(seconds) {
      if (seconds == null) return '';
      if (seconds >= 60 && seconds % 60 === 0) {
        const minutes = seconds / 60;
        return `${minutes} ${this.t('thermomix_min')}`;
      }
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${minutes} ${this.t('thermomix_min')} ${remaining} ${this.t('thermomix_sec')}`;
      }
      return `${seconds} ${this.t('thermomix_sec')}`;
    },

    formatThermomixSettings(settings) {
      if (!settings) return [];
      const badges = [];
      if (settings.temperature != null) {
        badges.push(`${settings.temperature}°C`);
      }
      if (settings.time != null) {
        badges.push(this.formatThermomixTime(settings.time));
      }
      if (settings.speed != null) {
        badges.push(`${this.t('thermomix_speed')} ${settings.speed}`);
      }
      if (settings.rotation) {
        badges.push(this.t(`thermomix_rotation_${settings.rotation}`, settings.rotation));
      }
      if (settings.mode) {
        badges.push(this.t(`thermomix_mode_${settings.mode}`, settings.mode));
      }
      return badges;
    },

    mapInstructionStep(step, thermomixEnabled, usesInlineThermomix) {
      const inlineThermomix = usesInlineThermomix && thermomixEnabled && step.thermomix;
      const textSource = inlineThermomix && step.thermomix.text ? step.thermomix.text : step.text;
      const settings = inlineThermomix ? step.thermomix.settings : thermomixEnabled ? step.settings : null;

      const ingredientIds = Array.isArray(step.ingredients) ? step.ingredients : null;

      return {
        text: this.translateField(textSource),
        image: step.image || null,
        settingsBadges: this.formatInstructionBadges(step, settings),
        ingredientIds,
      };
    },
  };
}
