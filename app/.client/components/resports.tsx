import { TargetResultsDashboard } from "./TargetResultsDashboard";
import { usePouchDB } from "../pouchdb";
import { Navbar, Page } from "../modules/navigation";
import Block from "./block";

// Simple demo component to showcase the TargetResultsDashboard
export function Reports() {
  const { db } = usePouchDB();

  return (
    <Page>
      <Navbar showBackButton={false} title="Reports"/>
      <Block>
      <TargetResultsDashboard db={db} />
      </Block>
    </Page>
  );
}
