import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useSeo } from "@/seo/Seo";
import { getDocPage } from "./registry";
import { mdxComponents } from "./mdx-components";
import { PlatformProvider } from "./platform-tabs";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function useOnPageToc(containerRef: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const headings = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
    setToc(
      headings
        .filter((heading) => heading.id)
        .map((heading) => ({
          id: heading.id,
          text: heading.textContent ?? "",
          level: heading.tagName === "H2" ? 2 : 3,
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return toc;
}

export default function DocsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const page = getDocPage(slug);
  const containerRef = useRef<HTMLDivElement>(null);
  const toc = useOnPageToc(containerRef, [page?.slug]);

  useSeo(page ? { title: `${page.title} - Hvsna Help`, description: page.description } : { title: "Not Found - Hvsna Help" });

  if (!page) {
    return (
      <article>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page not found</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">This documentation page doesn&apos;t exist.</p>
      </article>
    );
  }

  const { Component } = page;

  return (
    <div className="flex gap-10">
      <article ref={containerRef} className="min-w-0 flex-1">
        <PlatformProvider>
          <Component components={mdxComponents} />
        </PlatformProvider>
      </article>
      {toc.length > 0 && (
        <aside className="hidden xl:block w-48 shrink-0 sticky top-20 self-start">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">On this page</h3>
          <ul className="space-y-2 text-sm">
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                <a href={`#${item.id}`} className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
