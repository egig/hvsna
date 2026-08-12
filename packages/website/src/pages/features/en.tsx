import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useSeo } from "@/seo/Seo";

export default function FeaturePage() {
  useSeo();
  return (
    <>
      <Header currentLang="en" />
      <Features currentLang="en" />
      <Footer currentLang="en" />
    </>
  );
}
