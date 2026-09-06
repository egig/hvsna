import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Download from "@/components/Download";
import { useSeo } from "@/seo/Seo";

export default function DownloadPage() {
  useSeo();
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main>
        <Download currentLang="en" />
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
