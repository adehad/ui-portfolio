import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FilterSearch } from "@/cases/filter-builder/FilterSearch";

const meta = {
  title: "04 Filter Builder/Search",
  component: FilterSearch,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Nested AND/OR filter builder over a seeded music library. Each condition is an",
          "attribute, an operator legal for its type, and an operator-driven value input; one",
          "level of subgrouping is allowed, enforced by the AST schema itself. The panel below",
          "the builder mirrors the filter as text, Apply runs a paginated in-memory search,",
          "and the share string round-trips the whole filter through a compact versioned codec.",
        ].join(" "),
      },
    },
  },
} satisfies Meta<typeof FilterSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Search: Story = {
  play: async ({ canvasElement }) => {
    const view = within(canvasElement);

    // First rule: Formed >= 1990.
    await userEvent.click(view.getByRole("button", { name: "Condition" }));
    await userEvent.selectOptions(view.getByLabelText("Attribute"), "artist:Formed");
    await userEvent.selectOptions(view.getByLabelText("Operator"), "gte");
    await userEvent.type(view.getByPlaceholderText("value"), "1990");

    // Second rule: Explicit = true, then combine with OR.
    await userEvent.click(view.getByRole("button", { name: "Condition" }));
    const attributeSelects = view.getAllByLabelText("Attribute");
    const second = attributeSelects[1];
    if (!second) throw new Error("second rule did not render");
    await userEvent.selectOptions(second, "track:Explicit");
    const explicitValue = view.getAllByPlaceholderText("value")[1];
    if (!explicitValue) throw new Error("second value input did not render");
    await userEvent.type(explicitValue, "true");
    await userEvent.click(view.getByRole("radio", { name: "OR" }));

    // The mirror reflects both rules before anything runs.
    await expect(view.getByText("`Formed` ≥ 1990 OR `Explicit` = true")).toBeTruthy();

    await userEvent.click(view.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(view.getByText(/\(\d+ artists\)/)).toBeTruthy());

    // The tree renders a row per matching artist on this page.
    const carets = view.getAllByRole("button", { name: "Expand artist" });
    expect(carets.length).toBeGreaterThan(0);

    // Expanding an artist lazy-loads its albums.
    const firstCaret = carets[0];
    if (!firstCaret) throw new Error("no artist rows rendered");
    await userEvent.click(firstCaret);
    await waitFor(() =>
      expect(view.getAllByRole("button", { name: "Expand album" }).length).toBeGreaterThan(0),
    );

    // Round-trip the applied filter through the share string and the paste box.
    const share = canvasElement.querySelector("output");
    if (!share?.textContent) throw new Error("share string did not render");
    await userEvent.click(view.getByLabelText("Share string"));
    await userEvent.paste(share.textContent);
    await userEvent.click(view.getByRole("button", { name: "Load" }));
    await expect(view.getByText("`Formed` ≥ 1990 OR `Explicit` = true")).toBeTruthy();

    // Adding a group wraps everything built so far and joins with AND.
    await userEvent.click(view.getByRole("button", { name: "Group" }));
    await expect(view.getByText("(`Formed` ≥ 1990 OR `Explicit` = true) AND ()")).toBeTruthy();
  },
};
