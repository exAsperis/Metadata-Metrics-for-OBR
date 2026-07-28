import { describe, expect, it } from "vitest";
import {
  analyzeMetadata,
  appendArrayPath,
  appendObjectPath,
  formatBytes,
  MetadataAnalysisError,
  parseMetadata,
  utf8Bytes,
} from "./analyzeMetadata";

describe("analyzeMetadata", () => {
  it("handles empty metadata", () => {
    expect(analyzeMetadata({})).toEqual({
      totalBytes: 2,
      rootOverhead: 2,
      keyCount: 0,
      entries: [],
      namespaces: [],
    });
  });

  it("handles primitive values", () => {
    const result = analyzeMetadata({
      string: "value",
      number: 42,
      boolean: true,
      nil: null,
    });
    expect(result.entries.map(({ type }) => type)).toEqual([
      "string",
      "number",
      "boolean",
      "null",
    ]);
  });

  it("builds nested object and array nodes", () => {
    const [entry] = analyzeMetadata({ "com.test/metadata": { list: [1, 2] } })
      .entries;
    expect(entry.count).toBe(1);
    expect(entry.children[0].type).toBe("array");
    expect(entry.children[0].count).toBe(2);
    expect(entry.children[0].children[1].path).toBe(
      "com.test/metadata.list[1]",
    );
  });

  it("rolls top-level keys up by namespace", () => {
    const result = analyzeMetadata({
      "com.bryan.dungeon-world-creatures/characters": { count: 2 },
      "com.bryan.dungeon-world-creatures/settings": { enabled: true },
      "com.example.other/metadata": "small",
    });
    const creatures = result.namespaces.find(
      ({ name }) => name === "com.bryan.dungeon-world-creatures",
    );

    expect(creatures).toMatchObject({
      type: "namespace",
      count: 2,
      path: "com.bryan.dungeon-world-creatures",
    });
    expect(creatures?.children.map(({ name }) => name)).toEqual([
      "com.bryan.dungeon-world-creatures/characters",
      "com.bryan.dungeon-world-creatures/settings",
    ]);
    expect(creatures?.size).toBe(
      creatures?.children.reduce((sum, entry) => sum + entry.size, 0),
    );
    expect(
      result.namespaces.reduce((sum, namespace) => sum + namespace.size, 0) +
        result.rootOverhead,
    ).toBe(result.totalBytes);
  });

  it("counts UTF-8 bytes correctly", () => {
    expect(utf8Bytes("A")).toBe(1);
    expect(utf8Bytes("é")).toBe(2);
    expect(utf8Bytes("🦉")).toBe(4);
    expect(analyzeMetadata({ owl: "🦉" }).totalBytes).toBe(
      utf8Bytes(JSON.stringify({ owl: "🦉" })),
    );
  });

  it("handles large strings", () => {
    expect(analyzeMetadata({ data: "x".repeat(20_000) }).totalBytes).toBe(
      20_011,
    );
  });

  it.each([
    {},
    { a: 1 },
    { a: "é", b: [true, null, { deep: "🦉" }] },
    { "odd key": { '"quoted"': "value" }, z: false },
  ])("reconciles every top-level entry with root overhead", (metadata) => {
    const result = analyzeMetadata(metadata);
    expect(
      result.entries.reduce((sum, entry) => sum + entry.size, 0) +
        result.rootOverhead,
    ).toBe(result.totalBytes);
  });

  it("generates unambiguous paths", () => {
    expect(appendObjectPath("root", "simple")).toBe("root.simple");
    expect(appendObjectPath("root", "odd key")).toBe('root["odd key"]');
    expect(appendArrayPath("root.items", 3)).toBe("root.items[3]");
  });

  it("defensively rejects invalid roots and serialization", () => {
    expect(() => parseMetadata(null)).toThrow(MetadataAnalysisError);
    expect(() => parseMetadata([])).toThrow(MetadataAnalysisError);
    expect(() => analyzeMetadata({ bad: BigInt(1) })).toThrow(
      MetadataAnalysisError,
    );
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => analyzeMetadata(cyclic)).toThrow(MetadataAnalysisError);
  });

  it("formats bytes using decimal units", () => {
    expect(formatBytes(742)).toBe("742 B");
    expect(formatBytes(6420)).toBe("6.42 kB");
  });
});
