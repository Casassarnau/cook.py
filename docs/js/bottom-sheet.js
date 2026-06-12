function bottomSheetDrag(onClose, options = {}) {
  const { desktopModal = false, closeThreshold = 120 } = options;

  return {
    isDragging: false,
    startY: 0,
    currentY: 0,

    initDrag(e) {
      this.isDragging = true;
      this.startY = e.clientY || e.touches[0].clientY;
      this.currentY = 0;
    },

    doDrag(e) {
      if (!this.isDragging) return;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
      const deltaY = clientY - this.startY;
      this.currentY = Math.max(0, deltaY);
    },

    endDrag() {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.currentY > closeThreshold) {
        onClose();
      }
      this.currentY = 0;
    },

    resetDrag() {
      this.isDragging = false;
      this.currentY = 0;
    },

    panelTransform() {
      if (desktopModal && window.matchMedia('(min-width: 768px)').matches) return '';
      if (this.currentY === 0 && !this.isDragging) return '';
      return `transform: translateY(${this.currentY}px)`;
    },
  };
}
