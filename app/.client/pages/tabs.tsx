import { Page, Tabs, Tab, Link, Toolbar, ToolbarPane } from 'framework7-react';

export default () => (
  <Page pageContent={false}>
    <Toolbar bottom tabbar>
      <ToolbarPane>
        <Link tabLink href="/" routeTabId="today">
          Today
        </Link>
        {/* <Link tabLink href="/tab2/" routeTabId="tab2">
          Tab 2
        </Link> */}
        <Link tabLink href="/settings/" routeTabId="settings">
          Settings
        </Link>
      </ToolbarPane>
    </Toolbar>
    <Tabs routable>
      <Tab className="page-content" id="today" />
      <Tab className="page-content" id="tab2" />
      <Tab className="page-content" id="settings" />
    </Tabs>
  </Page>
);
