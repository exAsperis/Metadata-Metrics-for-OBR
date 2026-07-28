export type MetadataType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

export type MetadataNodeType = MetadataType | "namespace";

export interface MetadataNode {
  id: string;
  name: string;
  path: string;
  type: MetadataNodeType;
  size: number;
  count?: number;
  children: MetadataNode[];
}

export interface MetadataEntry extends MetadataNode {
  keyBytes: number;
  valueBytes: number;
}

export interface MetadataNamespace extends MetadataNode {
  type: "namespace";
  children: MetadataEntry[];
}

export interface MetadataAnalysis {
  totalBytes: number;
  rootOverhead: number;
  keyCount: number;
  entries: MetadataEntry[];
  namespaces: MetadataNamespace[];
}

export class MetadataAnalysisError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MetadataAnalysisError";
  }
}

export const utf8Bytes = (text: string): number =>
  new TextEncoder().encode(text).byteLength;

export function serializeJson(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError("Value is not JSON-serializable.");
    }
    return serialized;
  } catch (error) {
    throw new MetadataAnalysisError(
      "Room metadata could not be serialized as JSON.",
      { cause: error },
    );
  }
}

export function getMetadataType(value: unknown): MetadataType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    default:
      throw new MetadataAnalysisError(
        `Unsupported metadata value type: ${typeof value}.`,
      );
  }
}

export function appendObjectPath(parent: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

export function appendArrayPath(parent: string, index: number): string {
  return `${parent}[${index}]`;
}

function buildNode(
  name: string,
  path: string,
  value: unknown,
): MetadataNode {
  const type = getMetadataType(value);
  const size = utf8Bytes(serializeJson(value));
  const children: MetadataNode[] = [];

  if (type === "array") {
    (value as unknown[]).forEach((child, index) => {
      children.push(
        buildNode(`[${index}]`, appendArrayPath(path, index), child),
      );
    });
  } else if (type === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      children.push(buildNode(key, appendObjectPath(path, key), child));
    });
  }

  return {
    id: path,
    name,
    path,
    type,
    size,
    count:
      type === "array"
        ? (value as unknown[]).length
        : type === "object"
          ? Object.keys(value as object).length
          : undefined,
    children,
  };
}

export function parseMetadata(value: unknown): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new MetadataAnalysisError(
      "Room metadata response was not a key-value object.",
    );
  }
  return value as Record<string, unknown>;
}

export function analyzeMetadata(value: unknown): MetadataAnalysis {
  const metadata = parseMetadata(value);
  const totalBytes = utf8Bytes(serializeJson(metadata));
  const pairs = Object.entries(metadata);
  const rootOverhead = 2 + Math.max(0, pairs.length - 1);
  const entries = pairs.map(([key, entryValue]): MetadataEntry => {
    const keyBytes = utf8Bytes(serializeJson(key));
    const valueBytes = utf8Bytes(serializeJson(entryValue));
    return {
      ...buildNode(key, key, entryValue),
      size: keyBytes + 1 + valueBytes,
      keyBytes,
      valueBytes,
    };
  });
  const namespaceMap = new Map<string, MetadataEntry[]>();
  entries.forEach((entry) => {
    const separatorIndex = entry.name.indexOf("/");
    const namespace =
      separatorIndex === -1 ? entry.name : entry.name.slice(0, separatorIndex);
    const existing = namespaceMap.get(namespace);
    if (existing) existing.push(entry);
    else namespaceMap.set(namespace, [entry]);
  });
  const namespaces = Array.from(
    namespaceMap,
    ([namespace, namespaceEntries]): MetadataNamespace => ({
      id: `namespace:${namespace}`,
      name: namespace,
      path: namespace,
      type: "namespace",
      size: namespaceEntries.reduce((sum, entry) => sum + entry.size, 0),
      count: namespaceEntries.length,
      children: namespaceEntries,
    }),
  );

  return {
    totalBytes,
    rootOverhead,
    keyCount: pairs.length,
    entries,
    namespaces,
  };
}

export function formatBytes(bytes: number): string {
  return bytes < 1_000 ? `${bytes} B` : `${(bytes / 1_000).toFixed(2)} kB`;
}
