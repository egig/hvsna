import { SignedIn, SignedOut, SignOutButton } from "@clerk/clerk-react";
import { LogIn, Trash, Cog, Info, RefreshCw, User, LogOut } from "lucide-react";
import { Page } from "../../navigation";
import { MenuItem } from "../../../ui/menu-item";
import { Navbar } from "../../navigation";
import { useLanguageContext } from "../../i18n/LanguageContext";

export default function Settings() {
  const { t } = useLanguageContext();

  return (
    <Page>
      <Navbar title={t("settings")} showBackButton={false} />
      <SignedIn>
        <MenuItem title={t("account")} icon={User} to="/profile" />
      </SignedIn>
      <div className="bg-white">
        <SignedOut>
          <MenuItem title={t("sign_in")} icon={LogIn} to="/signin" />
        </SignedOut>
        <MenuItem title={t("general")} icon={Cog} to="/general-settings" />
        <SignedIn>
          <MenuItem title={t("sync")} icon={RefreshCw} to="/sync" />
        </SignedIn>
        <MenuItem
          title={t("reset_device_data")}
          icon={Trash}
          to="/wipe-local"
        />
        <MenuItem title={t("about")} icon={Info} to="/about" />
        <SignedIn>
          <SignOutButton>
            <MenuItem title={t("sign_out")} icon={LogOut} />
          </SignOutButton>
        </SignedIn>
      </div>
    </Page>
  );
}
