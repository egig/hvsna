import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { LogIn, Trash, Cog } from "lucide-react";
import { Page } from "../modules/navigation";
import { MenuItem } from "../components/MenuItem";
import { Navbar } from "../modules/navigation";

export default function Settings() {
  return (
    <Page>
      <Navbar title="Settings" />
      <div className="bg-white">
        <MenuItem
          title="General"
          subtitle="General application settings"
          icon={Cog}
          to="/general-settings"
        />

        <MenuItem
          title="Wipe Local data"
          subtitle="Delete all local data"
          icon={Trash}
          to="/wipe-local"
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
