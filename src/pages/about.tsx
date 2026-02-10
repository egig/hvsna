import { Page } from "../modules/navigation";
import packageInfo from "../../package.json";
import { Info } from "lucide-react";
import { useLanguageContext } from "../contexts/LanguageContext";
import { LargeNavbar } from "../modules/navigation";

export default function About() {
  const { t } = useLanguageContext();

  return (
    <Page>
      <LargeNavbar title={t("about")} showBackButton={true} />
      <div className="prose prose-sm p-4">
        <div className="flex items-center gap-3 mb-6">
          <Info className="text-[var(--hvsna-primary-color)]" size={32} />
          <h1 className="m-0">{t("about")}</h1>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">{packageInfo.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Version {packageInfo.version}
          </p>
          <p>{t("about_description")}</p>
        </div>
      </div>
    </Page>
  );
}
