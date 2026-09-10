import { PageTransition } from "@/modules/navigation";

type PageDesktopProps = {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  navbarLarge?: React.ReactNode;
  fluid?: boolean;
};

export function PageDesktop({
  children,
  navbar,
  navbarLarge,
  fluid,
}: PageDesktopProps) {
  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        {!!navbar && <div className="flex-shrink-0">{navbar}</div>}
        <div className="flex-1 overflow-y-auto">
          <div className={!fluid ? "max-w-2xl mx-auto w-full" : ""}>
            {!!navbarLarge && navbarLarge}
            {children}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
