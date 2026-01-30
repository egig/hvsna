import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { LogIn, Settings as SettingsIcon } from "lucide-react";
import { Page } from "../modules/navigation";
import { MenuItem } from "../components/MenuItem";
import { Navbar } from "../modules/navigation";

export default function Settings() {
  return (
    <Page>
      <Navbar title="Settings" showBackButton={false} />
      <div className="bg-white">
        <MenuItem
          title="Trackers"
          subtitle="Manage your tracking preferences"
          icon={SettingsIcon}
          to="/trackers"
        />

        <MenuItem
          title="Trackers Attributes"
          subtitle="Manage your tracking attributes"
          icon={SettingsIcon}
          to="/trackers-attributes"
        />

        <MenuItem
          title="Attribute Options"
          subtitle="Manage your attribute options"
          icon={SettingsIcon}
          to="/attribute-options"
        />

        <MenuItem
          title="Targets"
          subtitle="Manage your goals"
          icon={SettingsIcon}
          to="/targets"
        />
        <MenuItem
          title="Journal"
          subtitle="Manage your journal"
          icon={SettingsIcon}
          to="/journal"
        />

        <SignedIn>
          <MenuItem
            title="Sign Out"
            subtitle="Sign out of your account"
            icon={LogIn}
            onClick={() => {
              // Handle sign out logic here
            }}
          />
        </SignedIn>

        <SignedOut>
          <MenuItem
            title="Sign In"
            subtitle="Sign in to your account"
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
