;(function() {
  'use strict';

  class ConsentBanner {
    constructor(config) {
      // Merge default config with user config
      this.config = {
        storageType: 'localStorage',
        cookieDuration: 365,
        consentName: '_cb_consent',
        autoShow: true,
        forceShow: false,
        text: 'This website uses cookies to ensure you get the best experience.',
        detailedText: 'Click "Accept" to enable cookies or "Preferences" to choose which cookies to enable.',
        acceptButtonText: 'Accept All',
        rejectButtonText: 'Reject All',
        preferencesButtonText: 'Preferences',
        categories: {},
        vendors: {},
        ...config
      };
      
      // Initialize banner
      this.init();
    }

    init() {
      // Check if consent already exists
      if (!this.config.forceShow && this.hasConsent()) {
        return;
      }

      // Show banner if auto-show is enabled
      if (this.config.autoShow) {
        this.show();
      }
    }

    hasConsent() {
      const consent = this.getStoredConsent();
      return consent !== null;
    }

    getStoredConsent() {
      try {
        if (this.config.storageType === 'localStorage') {
          const stored = localStorage.getItem(this.config.consentName);
          return stored ? JSON.parse(stored) : null;
        } else {
          const value = document.cookie.match('(^|;)\\s*' + this.config.consentName + '\\s*=\\s*([^;]+)');
          return value ? JSON.parse(decodeURIComponent(value.pop())) : null;
        }
      } catch (error) {
        console.error('Error reading consent:', error);
        return null;
      }
    }

    saveConsent(consent) {
      try {
        const value = JSON.stringify(consent);
        if (this.config.storageType === 'localStorage') {
          localStorage.setItem(this.config.consentName, value);
        } else {
          const date = new Date();
          date.setTime(date.getTime() + (this.config.cookieDuration * 24 * 60 * 60 * 1000));
          document.cookie = `${this.config.consentName}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
        }
        
        // Trigger consent change event
        const event = new CustomEvent('consentChange', { detail: consent });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error saving consent:', error);
      }
    }

    show() {
      // Remove existing banner if any
      this.destroy();

      // Create banner element
      const banner = document.createElement('div');
      banner.className = 'cb-consent-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Cookie Consent');
      
      banner.innerHTML = `
        <div class="cb-content">
          <div class="cb-text">
            <p>${this.config.text}</p>
            <p class="cb-detailed">${this.config.detailedText}</p>
          </div>
          <div class="cb-buttons">
            <button type="button" class="cb-button cb-accept" aria-label="${this.config.acceptButtonText}">${this.config.acceptButtonText}</button>
            <button type="button" class="cb-button cb-reject" aria-label="${this.config.rejectButtonText}">${this.config.rejectButtonText}</button>
            <button type="button" class="cb-button cb-preferences" aria-label="${this.config.preferencesButtonText}">${this.config.preferencesButtonText}</button>
          </div>
        </div>
      `;

      // Add event listeners using bind to preserve context
      const acceptBtn = banner.querySelector('.cb-accept');
      const rejectBtn = banner.querySelector('.cb-reject');
      const preferencesBtn = banner.querySelector('.cb-preferences');

      acceptBtn.addEventListener('click', this.accept.bind(this));
      rejectBtn.addEventListener('click', this.reject.bind(this));
      preferencesBtn.addEventListener('click', this.showPreferences.bind(this));

      // Add to document
      document.body.appendChild(banner);
    }

    accept() {
      const consent = {};
      Object.keys(this.config.categories).forEach(category => {
        consent[category] = true;
      });
      this.saveConsent(consent);
      this.destroy();
    }

    reject() {
      const consent = {};
      Object.keys(this.config.categories).forEach(category => {
        consent[category] = this.config.categories[category].required || false;
      });
      this.saveConsent(consent);
      this.destroy();
    }

    showPreferences() {
      // Create modal container
      const modal = document.createElement('div');
      modal.className = 'cb-preferences-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Cookie Preferences');

      // Get current consent
      const currentConsent = this.getStoredConsent() || {};
      
      modal.innerHTML = `
        <div class="cb-modal-content">
          <h2>Cookie Preferences</h2>
          <div class="cb-categories">
            ${Object.entries(this.config.categories).map(([id, category]) => `
              <div class="cb-category">
                <div class="cb-category-header">
                  <label class="cb-category-label">
                    <input type="checkbox" 
                      ${category.required ? 'checked disabled' : ''} 
                      ${(!category.required && currentConsent[id]) ? 'checked' : ''}
                      data-category="${id}"
                      aria-label="${category.name}"
                    >
                    ${category.name}
                  </label>
                </div>
                <p class="cb-category-description">${category.description}</p>
              </div>
            `).join('')}
          </div>
          <div class="cb-modal-buttons">
            <button type="button" class="cb-button cb-save" aria-label="Save Preferences">Save Preferences</button>
          </div>
        </div>
      `;

      // Add event listeners
      const saveBtn = modal.querySelector('.cb-save');
      saveBtn.addEventListener('click', () => {
        const consent = {};
        modal.querySelectorAll('input[data-category]').forEach(checkbox => {
          const category = checkbox.getAttribute('data-category');
          consent[category] = checkbox.checked || this.config.categories[category].required;
        });
        this.saveConsent(consent);
        this.destroy();
        modal.remove();
      });

      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Add to document
      document.body.appendChild(modal);
    }

    destroy() {
      // Remove existing banner
      const existingBanner = document.querySelector('.cb-consent-banner');
      if (existingBanner) {
        existingBanner.remove();
      }

      // Remove existing modal
      const existingModal = document.querySelector('.cb-preferences-modal');
      if (existingModal) {
        existingModal.remove();
      }
    }
  }

  // Make available globally with a unique namespace
  window.CookieConsentBanner = {
    init: function(config) {
      return new ConsentBanner(config);
    }
  };
})();
