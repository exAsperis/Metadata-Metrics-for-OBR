import type { MetadataNode } from "./analyzeMetadata";

export function filterTree(
  nodes: MetadataNode[],
  query: string,
): MetadataNode[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return nodes;

  return nodes.flatMap((node) => {
    const children = filterTree(node.children, query);
    const matches =
      node.name.toLocaleLowerCase().includes(normalized) ||
      node.path.toLocaleLowerCase().includes(normalized);
    return matches || children.length > 0 ? [{ ...node, children }] : [];
  });
}
