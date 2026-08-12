import React from "react";

interface EnsureRequiredParamsProps {
  component: React.ElementType;
  props?: Record<string, any>;
  required?: string[];
  children: React.ReactNode;
}

/**
 * Utility component that conditionally wraps children with a component and props.
 *
 * If props is provided and has non-empty values for required props, children are wrapped with the component and props.
 * If required is specified, ALL required props must have non-empty values.
 * If required is not specified, checks if any prop value is non-empty.
 * If props is empty, undefined, or required values are empty, only children are returned.
 *
 * @param component - The React component to wrap children with
 * @param props - Props to pass to the wrapper component (optional)
 * @param required - Array of prop names that must all have non-empty values (optional)
 * @param children - The children to wrap or render directly
 *
 * @example
 * // With props - wraps children with div and className
 * <EnsureRequiredParams component="div" props={{ className: "wrapper" }}>
 *   <p>Content</p>
 * </EnsureRequiredParams>
 *
 * @example
 * // With required props - only wraps if ALL required props are non-empty
 * <EnsureRequiredParams component="div" props={{ apiKey: "key123", secret: "secret123" }} required={["apiKey", "secret"]}>
 *   <p>Content</p>
 * </EnsureRequiredParams>
 *
 * @example
 * // Without props - renders children directly
 * <EnsureRequiredParams component="div">
 *   <p>Content</p>
 * </EnsureRequiredParams>
 */
export const EnsureRequiredParams: React.FC<EnsureRequiredParamsProps> = ({
  component: Component,
  props,
  required,
  children,
}) => {
  const shouldWrap =
    props &&
    (required
      ? required.every((propName) => {
          const value = props[propName];
          return value !== null && value !== undefined && value !== "";
        })
      : Object.values(props).some(
          (value) => value !== null && value !== undefined && value !== ""
        ));

  if (shouldWrap) {
    return <Component {...props}>{children}</Component>;
  }

  return <>{children}</>;
};
