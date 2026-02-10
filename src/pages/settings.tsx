import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { LogIn, Trash, Cog, Info } from "lucide-react";
import { Page } from "../modules/navigation";
import { MenuItem } from "../components/MenuItem";
import { Navbar } from "../modules/navigation";
import { useLanguageContext } from "../contexts/LanguageContext";

export default function Settings() {
  const { t } = useLanguageContext();

  return (
    <Page>
      <Navbar title={t("settings")} showBackButton={false} />
      <div className="bg-white">
        <SignedIn>
          <MenuItem
            title={t("sign_out")}
            icon={LogIn}
            onClick={() => {
              // Handle sign out logic here
            }}
          />
        </SignedIn>

        <SignedOut>
          <MenuItem
            title={t("sign_in")}
            icon={LogIn}
          >
            <SignInButton mode="modal">
              <button className="w-full h-full"></button>
            </SignInButton>
          </MenuItem>
        </SignedOut>
        <MenuItem
          title={t("general")}
          icon={Cog}
          to="/general-settings"
        />
        <MenuItem
          title={t("wipe_local")}
          icon={Trash}
          to="/wipe-local"
        />
        <MenuItem
          title={t("about")}
          icon={Info}
          to="/about"
        />
      </div>
    </Page>
  );
}
