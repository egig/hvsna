import { useState, useEffect } from 'react';
import { Page, Tabs, Tab, Link, Toolbar, ToolbarPane, Fab, Sheet, Navbar, NavTitle, f7 } from 'framework7-react';
import { NotepadText, List, CogIcon, CheckSquare, Plus } from 'lucide-react';
import TaskForm from '../components/task-form';

export default () => {
  const [sheetOpened, setSheetOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  const openSheet = () => {
    setSheetOpened(true);
  };

  const closeSheet = () => {
    setSheetOpened(false);
  };

  useEffect(() => {
    // Listen for tab changes
    const handleTabShow = (tabEl: any) => {
      const tabId = tabEl.id;
      setActiveTab(tabId);
    };

    // Attach event listeners to tabs
    f7.on('tabShow', handleTabShow);

    // Get initial active tab from URL
    const currentUrl = f7.views.main.router.currentRoute.url;
    if (currentUrl.includes('/settings')) {
      setActiveTab('settings');
    } else if (currentUrl.includes('/tasks')) {
      setActiveTab('tasks');
    } else {
      setActiveTab('today');
    }

    return () => {
      f7.off('tabShow', handleTabShow);
    };
  }, []);

  const shouldShowFab = activeTab !== 'settings';

  return (
  <Page pageContent={false}>
    <Toolbar bottom tabbar>
      <ToolbarPane>
        <Link tabLink href="/" routeTabId="today">
          <NotepadText />
        </Link>
        <Link tabLink href="/tasks/" routeTabId="tasks">
          <CheckSquare />
        </Link>
        <Link tabLink href="/settings/" routeTabId="settings">
        <CogIcon />
        </Link>
      </ToolbarPane>
    </Toolbar>
    <Tabs routable>
      <Tab className="page-content" id="today" />
      <Tab className="page-content" id="tasks" />
      <Tab className="page-content" id="settings" />
    </Tabs>
    {shouldShowFab && (
      <Fab position='right-bottom' slot='fixed' className='mb-[60px]' onClick={openSheet}><Plus /></Fab>
    )}
    <Sheet 
      opened={sheetOpened} 
      onSheetClose={closeSheet}
      backdrop
      swipeToClose
      closeOnEscape
    >
      <TaskForm
        onSuccess={() => {
          setSheetOpened(false);
          // Optionally refresh tasks or show success message
        }}
        onError={(errorMessage) => {
          f7.dialog.alert(errorMessage);
        }}
        onCancel={() => {
          setSheetOpened(false);
        }}
      />
    </Sheet>
  </Page>
  );
};
