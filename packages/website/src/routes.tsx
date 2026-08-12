import { Route, Routes } from "react-router";

import HomeEn from "@/pages/home/en";
import HomeId from "@/pages/home/id";
import AboutEn from "@/pages/about/en";
import AboutId from "@/pages/about/id";
import FeaturesEn from "@/pages/features/en";
import FeaturesId from "@/pages/features/id";
import PricingEn from "@/pages/pricing/en";
import PricingId from "@/pages/pricing/id";
import PrivacyEn from "@/pages/privacy/en";
import PrivacyId from "@/pages/privacy/id";
import TermsEn from "@/pages/terms/en";
import TermsId from "@/pages/terms/id";
import Changelog from "@/pages/changelog";
import OptOut from "@/pages/opt-out";
import DocsLayout from "@/pages/docs/docs-layout";
import DocsPage from "@/pages/docs/docs-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeEn />} />
      <Route path="/about" element={<AboutEn />} />
      <Route path="/features" element={<FeaturesEn />} />
      <Route path="/pricing" element={<PricingEn />} />
      <Route path="/privacy" element={<PrivacyEn />} />
      <Route path="/terms" element={<TermsEn />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/opt-out" element={<OptOut />} />

      <Route path="/id" element={<HomeId />} />
      <Route path="/id/about" element={<AboutId />} />
      <Route path="/id/features" element={<FeaturesId />} />
      <Route path="/id/pricing" element={<PricingId />} />
      <Route path="/id/privacy" element={<PrivacyId />} />
      <Route path="/id/terms" element={<TermsId />} />

      <Route path="/docs" element={<DocsLayout />}>
        <Route index element={<DocsPage />} />
        <Route path=":slug" element={<DocsPage />} />
      </Route>
    </Routes>
  );
}
