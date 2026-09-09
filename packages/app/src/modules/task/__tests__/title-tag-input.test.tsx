import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { TagWithCount } from "@/domain/tag";
import { TitleTagInput } from "../title-tag-input";
import {
  effectiveTags,
  initialTitleTagField,
  strippedTitle,
  type TitleTagFieldState,
} from "../title-tag-field";

const mockFindAll = vi.fn();
vi.mock("../use-tag-repository", () => ({
  useTagRepository: () => ({ findAll: mockFindAll }),
}));
vi.mock("../../logger", () => ({ default: { error: vi.fn(), info: vi.fn() } }));

const TAGS: TagWithCount[] = [
  { id: "1", name: "personal", color: "#E57373", count: 1, createdAt: 0, updatedAt: 0 },
  { id: "2", name: "work", color: "#64B5F6", count: 1, createdAt: 0, updatedAt: 0 },
];

function Harness({ seed = "" }: { seed?: string }) {
  const [state, setState] = useState<TitleTagFieldState>(() =>
    initialTitleTagField(seed, [])
  );
  return (
    <>
      <TitleTagInput
        state={state}
        onStateChange={setState}
        ariaLabel="Task name"
        placeholder="Task name"
      />
      <output data-testid="effective">{effectiveTags(state).join(",")}</output>
      <output data-testid="stripped">{strippedTitle(state)}</output>
    </>
  );
}

function renderHarness(props?: { seed?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness {...props} />
    </QueryClientProvider>
  );
}

/** Replace the whole value with a caret at the end (jsdom puts the caret there on assignment). */
function typeAll(el: HTMLTextAreaElement, value: string) {
  el.focus();
  fireEvent.change(el, { target: { value } });
  el.setSelectionRange(value.length, value.length);
  fireEvent.select(el);
}

describe("TitleTagInput", () => {
  beforeEach(() => {
    mockFindAll.mockReset().mockResolvedValue(TAGS);
  });

  it("mirrors the typed title into the hidden taskName input", () => {
    renderHarness();
    const ta = screen.getByRole("textbox", { name: /task name/i }) as HTMLTextAreaElement;
    typeAll(ta, "Buy milk");
    expect(screen.getByTestId("stripped")).toHaveTextContent("Buy milk");
    const hidden = document.querySelector<HTMLInputElement>('input[name="taskName"]');
    expect(hidden?.value).toBe("Buy milk");
  });

  it("suggests a matching tag while typing a #run and commits it as a token", async () => {
    renderHarness();
    const ta = screen.getByRole("textbox", { name: /task name/i }) as HTMLTextAreaElement;
    typeAll(ta, "Buy #per");

    const option = await screen.findByRole("button", { name: /#personal/i });
    fireEvent.mouseDown(option);

    await waitFor(() =>
      expect(screen.getByTestId("effective")).toHaveTextContent("personal")
    );
    // token stripped out of the saved title
    expect(screen.getByTestId("stripped")).toHaveTextContent("Buy");
    expect(ta.value).toBe("Buy #personal ");
  });

  it("offers a create row for an unknown tag name", async () => {
    renderHarness();
    const ta = screen.getByRole("textbox", { name: /task name/i }) as HTMLTextAreaElement;
    typeAll(ta, "ship #newthing");

    const create = await screen.findByRole("button", { name: /create.*#newthing/i });
    fireEvent.mouseDown(create);

    await waitFor(() =>
      expect(screen.getByTestId("effective")).toHaveTextContent("newthing")
    );
    expect(screen.getByTestId("stripped")).toHaveTextContent("ship");
  });

  it("does not suggest a tag that is already committed", async () => {
    renderHarness();
    const ta = screen.getByRole("textbox", { name: /task name/i }) as HTMLTextAreaElement;
    typeAll(ta, "a #work");
    fireEvent.mouseDown(await screen.findByRole("button", { name: /#work/i }));
    await waitFor(() =>
      expect(screen.getByTestId("effective")).toHaveTextContent("work")
    );

    typeAll(ta, `${ta.value}#wo`);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /^#work$/i })).toBeNull();
    });
  });
});
