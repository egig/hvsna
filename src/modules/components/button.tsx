import * as React from "react";
import { Button as BaseUIButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(inputs);
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 active:bg-primary-800",
        destructive:
          "bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500 active:bg-danger-800",
        outline:
          "border border-primary-200 bg-white hover:bg-primary-50 hover:text-primary-900 focus-visible:ring-primary-500 dark:bg-primary-900 dark:border-primary-800 dark:hover:bg-primary-800 dark:hover:text-primary-50",
        secondary:
          "bg-primary-100 text-primary-900 hover:bg-primary-200 focus-visible:ring-primary-500 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-700",
        ghost:
          "hover:bg-primary-100 hover:text-primary-900 focus-visible:ring-primary-500 dark:hover:bg-primary-800 dark:hover:text-primary-50",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500 dark:text-primary-400",
        success:
          "bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500 active:bg-success-800",
        warning:
          "bg-warning-500 text-white hover:bg-warning-600 focus-visible:ring-warning-500 active:bg-warning-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof BaseUIButton>,
      "variant" | "size"
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <BaseUIButton
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </BaseUIButton>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
