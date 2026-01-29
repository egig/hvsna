import { PageTransition } from "./PageTransition";

export function Page({children}: {children: React.ReactNode}) {
  return <PageTransition>{children}</PageTransition>;
}