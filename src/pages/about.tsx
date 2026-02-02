import { Page } from "../modules/navigation";

export default function About() {
  return (
    <Page>
      <div className="prose prose-sm p-4">
        <h1>About</h1>
        <p>
          This is an opinionated logging app that helps you to be productive.
        </p>
      </div>
    </Page>
  );
}
