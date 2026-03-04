import { PageTransition } from "./page-transition";
import { useScreenSize } from "../../ui/screen-size-wrapper";

type PageProps = {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  navbarLarge?: React.ReactNode;
};

export function Page({ children, navbar, navbarLarge }: PageProps) {
  const { isDesktop } = useScreenSize();

  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {!!navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto">
          <div className={isDesktop ? "max-w-2xl mx-auto w-full" : ""}>
            {!!navbarLarge && navbarLarge}
            {children}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
