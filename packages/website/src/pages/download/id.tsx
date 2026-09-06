import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Download from "@/components/Download";
import { useSeo } from "@/seo/Seo";

export default function DownloadPageID() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="id" />
      <main>
        <Download currentLang="id" />
      </main>
      <Footer currentLang="id" />
    </div>
  );
}
