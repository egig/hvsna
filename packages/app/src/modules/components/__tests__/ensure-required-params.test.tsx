import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EnsureRequiredParams } from "../ensure-required-params";

describe("EnsureRequiredParams", () => {
  it("should render children without wrapper when props is empty", () => {
    render(
      <EnsureRequiredParams component="div">
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    // Check that there's no direct div wrapper around the content
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveClass("wrapper");
  });

  it("should render children without wrapper when props is undefined", () => {
    render(
      <EnsureRequiredParams component="div" props={undefined}>
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should wrap children with component when props is provided", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ className: "wrapper", "data-testid": "wrapper" }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("wrapper");
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should wrap children with custom component", () => {
    const CustomComponent = ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <section className={className} data-testid="custom-component">
        {children}
      </section>
    );

    render(
      <EnsureRequiredParams
        component={CustomComponent}
        props={{ className: "custom" }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const customComponent = screen.getByTestId("custom-component");
    expect(customComponent).toBeInTheDocument();
    expect(customComponent).toHaveClass("custom");
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should handle multiple children", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ "data-testid": "wrapper" }}
      >
        <span>First</span>
        <span>Second</span>
        <span>Third</span>
      </EnsureRequiredParams>
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("should handle empty props object", () => {
    render(
      <EnsureRequiredParams component="div" props={{}}>
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    // Check that there's no direct div wrapper around the content
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveClass("wrapper");
  });

  it("should render children without wrapper when all prop values are empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ className: "", id: "", "data-testid": "" }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveClass("wrapper");
  });

  it("should wrap children when at least one prop value is not empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ className: "wrapper", id: "", "data-testid": "wrapper" }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("wrapper");
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should wrap children when prop value is zero", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ "data-testid": "wrapper", count: 0 }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should wrap children when prop value is false", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ "data-testid": "wrapper", disabled: false }}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should wrap children when required prop is non-empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ apiKey: "key123", optional: "" }}
        required={["apiKey"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const span = screen.getByText("Test Content");
    expect(span.parentElement).toBeInTheDocument();
  });

  it("should not wrap children when required prop is empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ apiKey: "", optional: "value" }}
        required={["apiKey"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveAttribute("data-testid");
  });

  it("should not wrap children when one required prop is empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ apiKey: "", secret: "secret123" }}
        required={["apiKey", "secret"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveAttribute("data-testid");
  });

  it("should wrap children when all required props are non-empty", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ apiKey: "key123", secret: "secret123" }}
        required={["apiKey", "secret"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const span = screen.getByText("Test Content");
    expect(span.parentElement).toBeInTheDocument();
  });

  it("should wrap children when required prop is zero", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ count: 0, optional: "value" }}
        required={["count"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const span = screen.getByText("Test Content");
    expect(span.parentElement).toBeInTheDocument();
  });

  it("should wrap children when required prop is false", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ disabled: false, optional: "value" }}
        required={["disabled"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    const span = screen.getByText("Test Content");
    expect(span.parentElement).toBeInTheDocument();
  });

  it("should handle missing required prop in props object", () => {
    render(
      <EnsureRequiredParams
        component="div"
        props={{ optional: "value" }}
        required={["apiKey"]}
      >
        <span>Test Content</span>
      </EnsureRequiredParams>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
    const span = screen.getByText("Test Content");
    expect(span.parentElement).not.toHaveAttribute("data-testid");
  });
});
