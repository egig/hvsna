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
import { MenuItem } from "../../ui/menu-item";
import { Navbar } from "../navigation";

export default function Browse() {
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
          title="Tasks"
          subtitle="Manage your tasks"
          icon={CheckCheck}
          to="/tasks"
        />
      </div>
    </Page>
  );
}
