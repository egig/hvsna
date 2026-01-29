import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { LogIn, Trash, Settings as SettingsIcon } from "lucide-react";
import { Page, Navbar, MenuItem } from "../navigation/components";

export default function Settings() {
  return (
    <Page>
      <Navbar title="Settings" showBackButton={false} />
      <div className="bg-white">
        <MenuItem
          title="Trackers"
          subtitle="Manage your tracking preferences"
          icon={SettingsIcon}
          to="/trackers/"
        />
        
        <MenuItem
          title="Targets"
          subtitle="Manage your goals"
          icon={SettingsIcon}
          to="/targets/"
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