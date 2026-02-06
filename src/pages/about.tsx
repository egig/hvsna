import { Page } from "../modules/navigation";
import packageInfo from "../../package.json";
import { Info } from "lucide-react";

export default function About() {
  return (
    <Page>
      <div className="prose prose-sm p-4">
        <div className="flex items-center gap-3 mb-6">
          <Info className="text-blue-600" size={32} />
          <h1 className="m-0">About</h1>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">{packageInfo.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Version {packageInfo.version}
          </p>
          <p>
            This is an opinionated task management app that helps you to be
            productive.
          </p>
        </div>
      </div>
    </Page>
  );
}
