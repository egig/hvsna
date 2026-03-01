import { PageTransition } from "./page-transition";

type PageProps = {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  navbarLarge?: React.ReactNode;
};

export function Page({ children, navbar, navbarLarge }: PageProps) {
  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {!!navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto">
          {!!navbarLarge && navbarLarge}
          {children}
        </div>
      </div>
    </PageTransition>
  );
}
