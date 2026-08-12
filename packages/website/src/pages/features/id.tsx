import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useSeo } from "@/seo/Seo";

export default function FeaturePageID() {
  useSeo();
  return (
    <>
      <Header currentLang="id" />
      <Features currentLang="id" />
      <Footer currentLang="id" />
    </>
  );
}
