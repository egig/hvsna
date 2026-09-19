import type { ReactNode } from "react";

export default function BlockTitle({
  children,
  extra,
}: {
  children?: React.ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mx-4 my-4 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {extra && <div className="text-sm text-muted">{extra}</div>}
    </div>
  );
}
