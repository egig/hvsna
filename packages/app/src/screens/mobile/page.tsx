import { PageTransition } from "@/modules/navigation";

type PageMobileProps = {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  navbarLarge?: React.ReactNode;
};

export function PageMobile({ children, navbar, navbarLarge }: PageMobileProps) {
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
