import { Navbar, NavTitle, Page, Block, Button, NavRight, Link, f7 } from "framework7-react";
import { Plus, BarChart2 } from "lucide-react";

export default function PageEmpty({title, openAddPopup}: {title: string, openAddPopup: () => void}) {

  return (
    <Page >
      <Navbar backLink>
        <NavTitle>{title}</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      <Block inset strong outline>
        <div className="text-center">
          <BarChart2 size={48} />
          <p>No trackers yet</p>
          <p>Create your first tracker to start tracking!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Tracker
          </Button>
        </div>
      </Block>
    </Page>
  );
}
