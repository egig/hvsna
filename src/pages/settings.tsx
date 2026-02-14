import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { LogIn, Trash, Cog, Info, RefreshCw } from "lucide-react";
import { Page } from "../modules/navigation";
import { MenuItem } from "../components/MenuItem";
import { Navbar } from "../modules/navigation";
import { useLanguageContext } from "../contexts/LanguageContext";

export default function Settings() {
  const { t } = useLanguageContext();

  return (
    <Page>
      <Navbar title={t("settings")} showBackButton={false} />
      <SignedIn>
        <div className="flex justify-center align-center">
          <UserButton />
        </div>
        <MenuItem title={t("sync")} icon={RefreshCw} to="/sync" />
      </SignedIn>
      <div className="bg-white">
        <SignedOut>
          <MenuItem title={t("sign_in")} icon={LogIn} to="/signin" />
        </SignedOut>
        <MenuItem title={t("general")} icon={Cog} to="/general-settings" />
        <MenuItem title={t("wipe_local")} icon={Trash} to="/wipe-local" />
        <MenuItem title={t("about")} icon={Info} to="/about" />
      </div>
    </Page>
  );
}
