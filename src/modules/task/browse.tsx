import {
  HvPlus,
  HvList,
  HvSettings,
  HvSearch,
  HvTag,
  HvOutlineInbox,
} from "@/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { NavActionButton } from "../components/nav-action-button";
import { Button as Button2 } from "../components/button";
import { useLanguageContext } from "../i18n/LanguageContext";
import { MenuItem } from "../components/menu-item";

export default function Browse() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate("/settings");
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <NavActionButton
              variant="neutral"
              onClick={handleGoToSettings}
              aria-label={t("settings") || "Settings"}
            >
              <HvSettings size={20} />
            </NavActionButton>
          }
        />
      }
    >
      {/* Navigation Menu Items */}
      <div className="mb-6 space-y-1">
        <MenuItem
          icon={HvSearch}
          title={t("search") || "Search"}
          to="/search"
        />
        <MenuItem icon={HvTag} title={t("tags") || "Tags"} to="/tags" />
      </div>
    </Page>
  );
}
