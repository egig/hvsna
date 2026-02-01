import { PageTransition } from "./page-transition";

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      <div className="h-[100%] overflow-y-auto">{children}</div>
    </PageTransition>
  );
}
