import { HvSettings, HvHash } from "@/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { MenuItem } from "../components/menu-item";

export default function Browse() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <Page navbar={<Navbar title={t("browse")} showBackButton={false} />}>
      {/* Navigation Menu Items */}
      <div className="mb-6 space-y-1">
        <MenuItem icon={HvHash} title={t("tags") || "Tags"} to="/tags" />
        <MenuItem
          icon={HvSettings}
          title={t("settings") || "Settings"}
          to="/settings"
        />
      </div>
    </Page>
  );
}
