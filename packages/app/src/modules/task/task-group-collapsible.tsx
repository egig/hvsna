import type { ReactNode, Ref } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { HvChevronRight, HvChevronDown } from "@/modules/icons";

interface TaskGroupCollapsibleProps {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
  containerRef?: Ref<HTMLDivElement> | ((node: Element | null) => void);
  containerClassName?: string;
}

export function TaskGroupCollapsible({
  label,
  children,
  defaultOpen = true,
  count,
  containerRef,
  containerClassName,
}: TaskGroupCollapsibleProps) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen} className={"first:mt-2"}>
      <div
        ref={containerRef as Ref<HTMLDivElement>}
        className={containerClassName}
      >
        <Collapsible.Trigger className="flex items-center gap-1.5 px-4 w-full cursor-pointer group rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 py-1 transition-colors duration-150">
          <HvChevronRight className="size-3.5 shrink-0 text-gray-500 group-data-[panel-open]:hidden" />
          <HvChevronDown className="size-3.5 shrink-0 text-gray-500 hidden group-data-[panel-open]:block" />
          {label}
          {count !== undefined && (
            <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
              ({count})
            </span>
          )}
        </Collapsible.Trigger>
        <Collapsible.Panel className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0">
          {children}
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
}
