import { useLanguageContext } from "src/modules/i18n/LanguageContext";

interface ErrorDisplayProps {
  error: string;
  className?: string;
}

export function ErrorDisplay({ error, className = "" }: ErrorDisplayProps) {
  const { t } = useLanguageContext();

  return (
    <div className={`p-6 ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">{t("error")}</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    </div>
  );
}
