import { useLocation } from "react-router";

export interface PageContext {
  page: string;
  params: {
    tagName?: string;
  };
}

export function usePageContext(): PageContext {
  const { pathname } = useLocation();

  const tagMatch = pathname.match(/^\/tags\/(.+)$/);
  if (tagMatch) {
    return {
      page: "tag",
      params: { tagName: decodeURIComponent(tagMatch[1]) },
    };
  }

  const knownPages: Record<string, string> = {
    "/today": "today",
    "/upcoming": "upcoming",
    "/search": "search",
  };

  return {
    page: knownPages[pathname] ?? "unknown",
    params: {},
  };
}
