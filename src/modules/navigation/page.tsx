import { PageTransition } from "./page-transition";
import { useScreenSize } from "../components/screen-size-wrapper";

type PageProps = {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  navbarLarge?: React.ReactNode;
  fluid?: boolean;
};

export function Page({ children, navbar, navbarLarge, fluid }: PageProps) {
  const { isDesktop } = useScreenSize();

  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {!!navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto">
          <div
            className={isDesktop && !fluid ? "max-w-2xl mx-auto w-full" : ""}
          >
            {!!navbarLarge && navbarLarge}
            {children}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
