import { Link, useParams } from "react-router";
import { docsPages, docsNavTitle } from "./registry";

export default function DocsSidebar() {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug ?? "index";

  return (
    <nav className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 lg:self-start">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">{docsNavTitle}</h2>
      <ul className="space-y-1">
        {docsPages.map((page) => {
          const to = page.slug === "index" ? "/docs" : `/docs/${page.slug}`;
          const isActive = page.slug === activeSlug;
          return (
            <li key={page.slug}>
              <Link
                to={to}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {page.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
