import { useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronDown } from "lucide-react";
import { docsPages, docsNavTitle } from "./registry";

export default function DocsSidebar() {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug ?? "index";
  const [isOpen, setIsOpen] = useState(false);
  const activePage = docsPages.find((page) => page.slug === activeSlug);

  const links = (
    <ul className="space-y-1">
      {docsPages.map((page) => {
        const to = page.slug === "index" ? "/help" : `/help/${page.slug}`;
        const isActive = page.slug === activeSlug;
        return (
          <li key={page.slug}>
            <Link
              to={to}
              onClick={() => setIsOpen(false)}
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
  );

  return (
    <nav className="w-full lg:w-58 shrink-0 lg:sticky lg:top-20 lg:self-start">
      {/* Mobile/tablet: collapsible dropdown so the full page list doesn't push content down */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white"
          aria-expanded={isOpen}
        >
          <span>{activePage?.title ?? docsNavTitle}</span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2">{links}</div>
        )}
      </div>

      {/* Desktop: static sticky list */}
      <div className="hidden lg:block">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">{docsNavTitle}</h2>
        {links}
      </div>
    </nav>
  );
}
