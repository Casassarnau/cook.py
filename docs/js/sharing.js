function recipeSharing() {
  return {
    showQRCode() {
      this.showQRModal = true;
      this.urlCopied = false;

      this.$nextTick(() => {
        const recipeUrl = window.location.href.split('#')[0] + window.location.hash;
        const qrElement = document.getElementById('qrcode');

        if (!qrElement) return;

        qrElement.innerHTML = '';

        try {
          const colorDark = this.darkMode ? '#FFFFFF' : '#000000';
          const colorLight = this.darkMode ? '#1F2937' : '#FFFFFF';

          new QRCode(qrElement, {
            text: recipeUrl,
            width: 256,
            height: 256,
            colorDark: colorDark,
            colorLight: colorLight,
            correctLevel: QRCode.CorrectLevel.H,
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
          qrElement.innerHTML = '<p class="text-red-500">Error generating QR code</p>';
        }
      });
    },

    copyRecipeUrl() {
      const recipeUrl = window.location.href.split('#')[0] + window.location.hash;
      const recipeTitle = this.selectedRecipe ? this.translateField(this.selectedRecipe.title) : '';

      if (navigator.share) {
        navigator
          .share({
            title: recipeTitle || 'Recipe',
            text: recipeTitle || 'Check out this recipe',
            url: recipeUrl,
          })
          .then(() => {
            this.urlCopied = true;
            setTimeout(() => {
              this.urlCopied = false;
            }, 2000);
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              this.fallbackCopyToClipboard(recipeUrl);
            }
          });
      } else {
        this.fallbackCopyToClipboard(recipeUrl);
      }
    },

    fallbackCopyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.urlCopied = true;
            setTimeout(() => {
              this.urlCopied = false;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy URL:', err);
          });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this.urlCopied = true;
          setTimeout(() => {
            this.urlCopied = false;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy URL:', err);
        }
        document.body.removeChild(textArea);
      }
    },

    canUseWebShare() {
      return navigator.share !== undefined;
    },
  };
}
