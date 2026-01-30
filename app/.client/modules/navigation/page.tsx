import { PageTransition } from "./page-transition";

export function Page({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
