import { describe, expect, it } from "vitest";
import { analyzeMetadata } from "./analyzeMetadata";
import { filterTree } from "./search";

describe("filterTree", () => {
  const nodes = analyzeMetadata({
    root: { Characters: [{ inventory: { slots: 2 } }] },
    unrelated: true,
  }).entries;

  it("matches case-insensitive keys and preserves ancestors", () => {
    const result = filterTree(nodes, "INVENTORY");
    expect(result.map((node) => node.name)).toEqual(["root"]);
    expect(result[0].children[0].children[0].children[0].name).toBe(
      "inventory",
    );
  });

  it("does not search primitive values", () => {
    expect(filterTree(nodes, "true")).toEqual([]);
  });
});
