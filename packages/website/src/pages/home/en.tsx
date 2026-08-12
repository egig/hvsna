import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useSeo } from "@/seo/Seo";

export default function HomePage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <Hero currentLang="en" />
        <Features currentLang="en" />
        <CTA currentLang="en" />
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
