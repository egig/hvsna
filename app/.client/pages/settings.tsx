import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Icon, List, ListItem, Navbar, NavRight, NavTitle, Page } from "framework7-react";
import { LogIn, Trash } from "lucide-react";

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
      <ListItem link="/trackers/" title="Trackers">
        <Icon slot="media" f7="chart_bar_alt_fill" />
      </ListItem>
      <ListItem link="/targets/" title="Targets">
        <Icon slot="media" f7="graph_square" />
      </ListItem>
      <ListItem link="/journal/" title="Journal">
        <Icon slot="media" f7="book_fill" />
      </ListItem>
      <ListItem link="/categories/" title="Categories">
        <Icon slot="media" f7="tags_fill" />
      </ListItem>
    </List>
    <List strong inset dividersIos className="components-list searchbar-found">
      <ListItem link="/data-management/" title="Wipe Local Data">
        <Icon slot="media" f7="paintbrush" />
      </ListItem>
    </List>
  </Page>
);
}