import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("renders a default button", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary-600", "text-white");
  });

  it("renders different variants", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("bg-danger-600");

    rerender(<Button variant="outline">Cancel</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("border", "border-primary-200");

    rerender(<Button variant="success">Success</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bg-success-600");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole("button");
    expect(button).toHaveClass("h-9");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("h-11");

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole("button");
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("shows loading state", () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("disabled");

    // Check for loading spinner
    const spinner = button.querySelector("svg.animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button");
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger click when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    const button = screen.getByRole("button");
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("does not trigger click when loading", () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    );
    const button = screen.getByRole("button");
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
