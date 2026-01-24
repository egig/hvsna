import { Icon, List, ListItem, Navbar, Page } from "framework7-react";

export default function Settings() {
return (
  <Page>
    <Navbar large title={"Settings"} titleLarge={"Settings"}></Navbar>
    <List strong inset dividersIos className="components-list searchbar-found">
      <ListItem link="/template/" title="Template">
        <Icon slot="media" icon="icon-f7" />
      </ListItem>
    </List>
  </Page>
);
}