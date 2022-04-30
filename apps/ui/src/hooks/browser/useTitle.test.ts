import { renderHook } from "@testing-library/react-hooks";

import { useTitle } from "./useTitle";

describe("useTitle", () => {
  it("updates the document title if the title changes", () => {
    const { rerender } = renderHook(({ title }) => useTitle(title), {
      initialProps: { title: "First Title" },
    });
    expect(document.title).toEqual("First Title | Swim");

    rerender({ title: "Second Title" });

    expect(document.title).toEqual("Second Title | Swim");
  });
});
