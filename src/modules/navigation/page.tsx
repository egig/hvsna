import { PageTransition } from "./page-transition";

export function Page({ children, navbar }: { children: React.ReactNode, navbar?: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {!!navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto">
        {children}
        </div>
      </div>
    </PageTransition>
  );
}
