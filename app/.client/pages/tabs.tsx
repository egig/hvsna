import { Page, Tabs, Tab, Link, Toolbar, ToolbarPane } from 'framework7-react';
import { NotepadText, List, CogIcon } from 'lucide-react';

export default () => (
  <Page pageContent={false}>
    <Toolbar bottom tabbar>
      <ToolbarPane>
        <Link tabLink href="/" routeTabId="today">
          <NotepadText />
        </Link>
        <Link tabLink href="/notes/" routeTabId="notes">
          <List />
        </Link>
        <Link tabLink href="/settings/" routeTabId="settings">
        <CogIcon />
        </Link>
      </ToolbarPane>
    </Toolbar>
    <Tabs routable>
      <Tab className="page-content" id="today" />
      <Tab className="page-content" id="notes" />
      <Tab className="page-content" id="settings" />
    </Tabs>
  </Page>
);
