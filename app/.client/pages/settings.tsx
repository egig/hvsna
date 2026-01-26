import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Icon, List, ListItem, Navbar, NavRight, NavTitle, Page } from "framework7-react";
import { LogIn } from "lucide-react";

export default function Settings() {
return (
  <Page>
    <Navbar>
      <NavTitle>
        Settings
      </NavTitle>
      <NavRight>
        <SignedIn>
        <UserButton/>
        </SignedIn>
        <SignedOut>
          <SignInButton component="button">
            <LogIn />
          </SignInButton>
        </SignedOut>
      </NavRight>
    </Navbar>
    <List strong inset dividersIos className="components-list searchbar-found">
      <ListItem link="/template/" title="Template">
        <Icon slot="media" f7="person_alt_circle" />
      </ListItem>
      <ListItem link="/data-management/" title="Data Management">
        <Icon slot="media" f7="folder_fill_badge_minus" />
      </ListItem>
    </List>
  </Page>
);
}