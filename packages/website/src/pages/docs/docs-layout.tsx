import { Outlet } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocsSidebar from "./docs-sidebar";

export default function DocsLayout() {
  return (
    <div className="min-h-screen">
      <Header currentLang="en" />
      <main className="mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10">
          <DocsSidebar />
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer currentLang="en" />
    </div>
  );
}
