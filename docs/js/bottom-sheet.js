let bottomSheetScrollLockDepth = 0;

function bottomSheetScrollLock(locked) {
  bottomSheetScrollLockDepth += locked ? 1 : -1;
  if (bottomSheetScrollLockDepth < 0) bottomSheetScrollLockDepth = 0;
  document.body.classList.toggle('overflow-hidden', bottomSheetScrollLockDepth > 0);
}

function bottomSheetDrag(onClose, options = {}) {
  const {
    desktopModal = false, closeThreshold = 120
  } = options;

  return {
    isDragging: false,
    startY: 0,
    currentY: 0,
    _captureEl: null,
    _captureId: null,

    onOpenChange(isOpen) {
      bottomSheetScrollLock(isOpen);
      if (!isOpen) this.resetDrag();
    },

    initDrag(e) {
      e.preventDefault();
      this.isDragging = true;
      this.startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      this.currentY = 0;
      if (e.pointerId != null && e.currentTarget?.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
        this._captureEl = e.currentTarget;
        this._captureId = e.pointerId;
      }
    },

    doDrag(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const deltaY = clientY - this.startY;
      this.currentY = Math.max(0, deltaY);
    },

    endDrag() {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this._captureEl && this._captureId != null) {
        try {
          this._captureEl.releasePointerCapture(this._captureId);
        } catch (_) {}
        this._captureEl = null;
        this._captureId = null;
      }
      if (this.currentY > closeThreshold) {
        onClose();
      }
      this.currentY = 0;
    },

    resetDrag() {
      this.isDragging = false;
      this.currentY = 0;
      this._captureEl = null;
      this._captureId = null;
    },

    panelTransform() {
      if (desktopModal && window.matchMedia('(min-width: 768px)').matches) return '';
      if (this.currentY === 0 && !this.isDragging) return '';
      return `transform: translateY(${this.currentY}px)`;
    },
  };
}
