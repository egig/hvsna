import { expect } from "@playwright/test";
import { test as base } from "@playwright/test";
import { OnboardingPage } from "../../page-objects/OnboardingPage";
import { resetPouchDB } from "../../helpers/db-reset";
import { mockAladhanAPI } from "../../helpers/api-mocks";

type OnboardingFixtures = {
  onboardingPage: OnboardingPage;
  page: any; // Playwright Page
};

export const test = base.extend<OnboardingFixtures>({
  page: async ({ page }, use) => {
    await mockAladhanAPI(page);
    await use(page);
  },

  onboardingPage: async ({ page }, use) => {
    const onboarding = new OnboardingPage(page);
    
    // Clean setup for fresh onboarding
    await resetPouchDB(page);
    await page.goto("/");
    await onboarding.waitForOnboardingPage();
    
    await use(onboarding);
    
    // Cleanup
    await resetPouchDB(page);
  },
});

export { expect };
