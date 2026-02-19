import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import {
  ChartArea,
  CheckCheck,
  GitBranchIcon,
  List,
  Logs,
  Settings,
  Target,
} from "lucide-react";
import { Button, Page } from "../navigation";
import { MenuItem } from "../../ui/MenuItem";
import { Navbar } from "../navigation";
import { useFeatureFlag } from "src/modules/feature-flags/useFeatureFlags";

export default function Browse() {
  const attrEnabled = useFeatureFlag("TRACKER_ATTR");
  return (
    <Page>
      <Navbar
        title="Browse"
        showBackButton={false}
        rightAction={
          <Button to="/settings" navType="modal">
            <Settings />
          </Button>
        }
      />
      <div className="bg-white">
        <MenuItem
          title="Goals"
          subtitle="Manage your goals"
          icon={Target}
          to="/goals"
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
          title="Tasks"
          subtitle="Manage your tasks"
          icon={CheckCheck}
          to="/tasks"
        />
      </div>
    </Page>
  );
}
