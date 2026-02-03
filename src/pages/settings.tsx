import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import {
  ChartArea,
  ChartBar,
  GitBranchIcon,
  List,
  LogIn,
  Logs,
  Settings as SettingsIcon,
  Target,
  Trash,
  Cog,
} from "lucide-react";
import { Page } from "../modules/navigation";
import { MenuItem } from "../components/MenuItem";
import { Navbar } from "../modules/navigation";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";

export default function Settings() {
  const attrEnabled = useFeatureFlag("TRACKER_ATTR");
  return (
    <Page>
      <Navbar title="Settings" showBackButton={false} />
      <div className="bg-white">
        <MenuItem
          title="General"
          subtitle="General application settings"
          icon={Cog}
          to="/general-settings"
        />

        <MenuItem
          title="Trackers"
          subtitle="Manage your tracking preferences"
          icon={ChartArea}
          to="/trackers"
        />

        {attrEnabled && (
          <MenuItem
            title="Trackers Attributes"
            subtitle="Manage your tracking attributes"
            icon={GitBranchIcon}
            to="/trackers-attributes"
          />
        )}

        {attrEnabled && (
          <MenuItem
            title="Attribute Options"
            subtitle="Manage your attribute options"
            icon={List}
            to="/attribute-options"
          />
        )}

        <MenuItem
          title="Logs"
          subtitle="Manage your logs"
          icon={Logs}
          to="/logs"
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
