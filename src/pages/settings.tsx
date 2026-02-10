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
        <MenuItem
          title={t("general")}
          subtitle={t("general_application_settings")}
          icon={Cog}
          to="/general-settings"
        />

        <MenuItem
          title={t("about")}
          subtitle={t("about_app")}
          icon={Info}
          to="/about"
        />

        <MenuItem
          title={t("wipe_local")}
          subtitle={t("wipe_local_subtitle")}
          icon={Trash}
          to="/wipe-local"
        />

        <SignedIn>
          <MenuItem
            title={t("sign_out")}
            subtitle={t("sign_out_subtitle")}
            icon={LogIn}
            onClick={() => {
              // Handle sign out logic here
            }}
          />
        </SignedIn>

        <SignedOut>
          <MenuItem
            title={t("sign_in")}
            subtitle={t("sign_in_subtitle")}
            icon={LogIn}
          >
            <SignInButton mode="modal">
              <button className="w-full h-full"></button>
            </SignInButton>
          </MenuItem>
        </SignedOut>
      </div>
    </Page>
  );
}
