import type { ComponentPropsWithoutRef } from "react";

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-10 mb-4" {...props} />,
  h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4" {...props} />,
  h3: (props: ComponentPropsWithoutRef<"h3">) => <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3" {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="text-lg text-gray-600 dark:text-gray-300 mb-5 leading-relaxed" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 mb-5 space-y-2 pl-4" {...props} />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <ol className="list-decimal list-inside text-lg text-gray-600 dark:text-gray-300 mb-5 space-y-2 pl-4" {...props} />,
  li: (props: ComponentPropsWithoutRef<"li">) => <li {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => <a className="text-primary-600 dark:text-primary-400 underline hover:no-underline" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="text-gray-900 dark:text-white" {...props} />,
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code className="text-sm bg-gray-100 dark:bg-gray-800 text-primary-700 dark:text-primary-300 rounded px-1.5 py-0.5" {...props} />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto mb-5 text-sm" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto mb-5">
      <table className="w-full text-left border-collapse" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-2 pr-4" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 py-2 pr-4" {...props} />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => <hr className="border-gray-200 dark:border-gray-700 my-8" {...props} />,
};
