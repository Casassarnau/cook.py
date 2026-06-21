function recipeOven() {
  return {
    formatOvenTime(seconds) {
      if (seconds == null) return '';
      if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (minutes === 0) {
          return `${hours} ${this.t('oven_h')}`;
        }
        return `${hours} ${this.t('oven_h')} ${minutes} ${this.t('oven_min')}`;
      }
      if (seconds >= 60 && seconds % 60 === 0) {
        const minutes = seconds / 60;
        return `${minutes} ${this.t('oven_min')}`;
      }
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${minutes} ${this.t('oven_min')} ${remaining} ${this.t('oven_sec')}`;
      }
      return `${seconds} ${this.t('oven_sec')}`;
    },

    normalizeOvenModes(mode) {
      if (!mode) return [];
      const modes = Array.isArray(mode) ? mode : [mode];
      return modes.flatMap(m => (m === 'top_bottom' ? ['top', 'bottom'] : [m]));
    },

    formatOvenMode(mode) {
      return this.normalizeOvenModes(mode).map(m => this.t(`oven_mode_${m}`, m));
    },

    formatOvenSettings(oven) {
      if (!oven) return [];
      const badges = [];
      if (oven.temperature != null) {
        badges.push(`${oven.temperature}°C`);
      }
      if (oven.time != null) {
        badges.push(this.formatOvenTime(oven.time));
      }
      for (const label of this.formatOvenMode(oven.mode)) {
        if (label) badges.push(label);
      }
      return badges;
    },

    formatInstructionBadges(step, thermomixSettings) {
      const badges = [];
      for (const text of this.formatOvenSettings(step.oven)) {
        badges.push({
          text,
          kind: 'oven'
        });
      }
      for (const text of this.formatThermomixSettings(thermomixSettings)) {
        badges.push({
          text,
          kind: 'thermomix'
        });
      }
      return badges;
    },
  };
}
