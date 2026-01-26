import { Icon, List, ListItem, Navbar, NavTitle, Page, f7, Block, Button } from "framework7-react";
import { Database, Trash2 } from "lucide-react";
import { usePouchDB } from "../contexts/PouchDB";

export default function DataManagement() {
  const { db } = usePouchDB();

  const handleWipePouchDB = () => {
    f7.dialog.confirm(
      'Are you sure you want to delete the entire PouchDB database? This will remove all stored data and cannot be undone.',
      'Delete PouchDB Database',
      async () => {
        try {
          // Destroy the entire database
          await db.destroy();
          
          f7.dialog.alert(
            'PouchDB database has been successfully deleted. The app will need to be restarted to create a fresh database.',
            'Database Deleted',
            () => {
              // Navigate back to settings
              // f7.routes.router.back();
            }
          );
        } catch (error) {
          console.error('Error destroying database:', error);
          f7.dialog.alert(
            'An error occurred while deleting the database. Please try again.',
            'Error'
          );
        }
      }
    );
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Data Management</NavTitle>
      </Navbar>

      <List strong inset dividersIos className="components-list">
        <ListItem
          header="Warning"
          title="Data deletion is permanent"
          footer="These actions cannot be undone. Please make sure you have backups if needed."
        >
          <Icon slot="media" f7="exclamationmark_triangle_fill" color="orange" />
        </ListItem>
      </List>

      <Block>
        <Button fill color="red" onClick={handleWipePouchDB}>Wipe All Data</Button>
      </Block>

    </Page>
  );
}
