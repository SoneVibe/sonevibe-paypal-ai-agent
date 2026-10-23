import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentReply } from "../format/reply";

describe("agent reply renderer", () => {
  it("renders bold, lists, and internal quote links", () => {
    render(
      <AgentReply
        text={
          "See **security**.\n\n- First\n- Second\n\n1. One\n\n[Open the draft quote](#/quote/q_mock_0001)\n\n#/quote/q_mock_0002"
        }
      />,
    );
    expect(screen.getByText("security").tagName).toBe("STRONG");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Open the draft quote" })).toHaveAttribute(
      "href",
      "#/quote/q_mock_0001",
    );
    expect(screen.getByRole("link", { name: "#/quote/q_mock_0002" })).toHaveAttribute(
      "href",
      "#/quote/q_mock_0002",
    );
  });

  it("keeps external urls and markup as text", () => {
    const { container } = render(
      <AgentReply text={'Visit https://evil.example/phish <img src=x onerror="alert(1)"> [click](https://evil.example/a) [bad](javascript:alert(1))'} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("https://evil.example/phish");
    expect(container.textContent).toContain("<img");
    expect(container.textContent).toContain("javascript:alert(1)");
  });
});
