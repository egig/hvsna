import type { Page } from "@playwright/test";

export class OnboardingPage {
  constructor(public page: Page) {}

  // Step indicator and navigation
  async getCurrentStep(): Promise<number> {
    // Step content is conditionally rendered (not just hidden), so isVisible() is reliable
    // when called after selectLanguage/useCurrentLocation have awaited the step transition.
    if (await this.page.locator('[data-testid="notification-setup-step"]').isVisible()) return 3;
    if (await this.page.locator('[data-testid="location-setup-step"]').isVisible()) return 2;
    return 1;
  }

  async getStepIndicator(step: number) {
    return this.page.locator(`[data-testid="step-${step}"]`);
  }

  async getProgressBar(step: '1-2' | '2-3') {
    return this.page.locator(`[data-testid="progress-bar-${step}"]`);
  }

  async clickBackButton() {
    // Look for back button in navbar
    await this.page.locator('[data-testid="navbar-back-button"]').click();
  }

  // Language selection
  async selectLanguage(language: 'en' | 'id') {
    await this.page.locator(`[data-testid="language-${language}"]`).click();
    // Wait for step to advance — language step unmounts after async save + state update
    await this.page
      .locator('[data-testid="language-selection-step"]')
      .waitFor({ state: 'hidden', timeout: 10000 });
  }

  async getLanguageButton(language: 'en' | 'id') {
    return this.page.locator(`[data-testid="language-${language}"]`);
  }

  async isLanguageSelected(language: 'en' | 'id'): Promise<boolean> {
    const button = await this.getLanguageButton(language);
    const indicator = button.locator('.w-5.h-5.rounded-full');
    return await indicator.isVisible();
  }

  // Location setup
  async useCurrentLocation() {
    await this.page.locator('[data-testid="use-current-location"]').click();
    // Wait for step to advance — location step unmounts after geolocation + save
    await this.page
      .locator('[data-testid="location-setup-step"]')
      .waitFor({ state: 'hidden', timeout: 15000 });
  }

  async openTimezoneModal() {
    await this.page.locator('[data-testid="timezone-picker-button"]').click();
  }

  async selectTimezone(timezone: string) {
    // Open modal first if not already open
    const modal = this.page.locator('[data-testid="timezone-modal"]');
    if (!(await modal.isVisible())) {
      await this.openTimezoneModal();
    }
    
    // Select timezone from modal (assuming timezone options have data-testid)
    await this.page.locator(`[data-testid="timezone-option-${timezone.replace(/[^a-zA-Z0-9]/g, '')}"]`).click();
  }

  async continueWithManualTimezone() {
    await this.page.locator('[data-testid="continue-timezone"]').click();
  }

  async getSelectedTimezone(): Promise<string> {
    const timezoneDisplay = this.page.locator('[data-testid="selected-timezone"]');
    return await timezoneDisplay.textContent() || '';
  }

  // Notification setup
  async enableNotifications() {
    await this.page.locator('[data-testid="enable-notifications"]').click();
    // Completes onboarding — page redirects via window.location.href = "/"
    await this.page.waitForURL('/', { timeout: 15000 });
  }

  async skipNotifications() {
    await this.page.locator('[data-testid="skip-notifications"]').click();
    // Completes onboarding — page redirects via window.location.href = "/"
    await this.page.waitForURL('/', { timeout: 15000 });
  }

  // Page content verification
  async getWelcomeTitle(): Promise<string> {
    return await this.page.locator('[data-testid="welcome-title"]').textContent() || '';
  }

  async getLocationSetupTitle(): Promise<string> {
    return await this.page.locator('[data-testid="location-title"]').textContent() || '';
  }

  async getNotificationSetupTitle(): Promise<string> {
    return await this.page.locator('[data-testid="notification-title"]').textContent() || '';
  }

  async isStepLoading(): Promise<boolean> {
    // Check if any button is disabled during loading
    const disabledButtons = await this.page.locator('button:disabled').count();
    return disabledButtons > 0;
  }

  // URL and navigation verification
  async waitForOnboardingPage(): Promise<void> {
    await this.page.waitForURL('/onboarding');
  }

  async waitForMainApp(): Promise<void> {
    await this.page.waitForURL('/');
  }

  // Error handling
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    return await errorElement.isVisible() ? await errorElement.textContent() : null;
  }

  // Privacy notes verification
  async getLocationPrivacyNote(): Promise<string> {
    const note = this.page.locator('[data-testid="location-privacy-note"]');
    return await note.textContent() || '';
  }

  async getNotificationPrivacyNote(): Promise<string> {
    const note = this.page.locator('[data-testid="notification-privacy-note"]');
    return await note.textContent() || '';
  }

  // Step visibility helpers
  async isLanguageStepVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="language-selection-step"]').isVisible();
  }

  async isLocationStepVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="location-setup-step"]').isVisible();
  }

  async isNotificationStepVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="notification-setup-step"]').isVisible();
  }
}
