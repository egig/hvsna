import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useSeo } from "@/seo/Seo";

export default function HomePageID() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        <Hero currentLang="id" />
        <Features currentLang="id" />
        <CTA currentLang="id" />
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
