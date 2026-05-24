import {
  HvSettings,
  HvHash,
  HvOutlineEllipsisHorizontalCircle,
  HvCheckCircle,
  HvCheckSquare2,
  HvReplayCircle,
} from "@/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { MenuItem } from "../components/menu-item";

export default function Browse() {
  const { t } = useLanguageContext();

  return (
    <Page
      navbar={
        <Navbar
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <Button to={"/settings"}>
              <HvSettings />
            </Button>
          }
        />
      }
    >
      {/* Navigation Menu Items */}
      <div className="mb-6 space-y-1">
        <MenuItem
          icon={HvReplayCircle}
          title={t("recurring") || "Recurring"}
          to="/recurring"
        />
        <MenuItem
          icon={HvCheckSquare2}
          title={t("completed") || "Completed"}
          to="/completed"
        />
        <MenuItem icon={HvHash} title={t("tags") || "Tags"} to="/tags" />
      </div>
    </Page>
  );
}
