import { useMemo, useState } from "react";
import { ARRAY_PAGE_SIZE } from "../constants";
import {
  formatBytes,
  type MetadataNode,
} from "../metadata/analyzeMetadata";

interface TreeProps {
  nodes: MetadataNode[];
  totalBytes: number;
  searchActive: boolean;
}

function MiniBar({ value }: { value: number }) {
  return (
    <span className="mini-track" aria-hidden="true">
      <span style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </span>
  );
}

async function copyPath(path: string, setCopied: (path: string) => void) {
  await navigator.clipboard.writeText(path);
  setCopied(path);
  window.setTimeout(() => setCopied(""), 1200);
}

function TreeNode({
  node,
  parentBytes,
  depth,
  forceOpen,
  copied,
  setCopied,
}: {
  node: MetadataNode;
  parentBytes: number;
  depth: number;
  forceOpen: boolean;
  copied: string;
  setCopied: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const expandable = node.children.length > 0;
  const isOpen = expandable && (open || forceOpen);
  const percent = parentBytes === 0 ? 0 : (node.size / parentBytes) * 100;
  const sortedChildren = useMemo(
    () =>
      node.type === "array"
        ? node.children
        : [...node.children].sort((a, b) => b.size - a.size),
    [node.children, node.type],
  );
  const pageCount = Math.max(1, Math.ceil(sortedChildren.length / ARRAY_PAGE_SIZE));
  const visibleChildren =
    node.type === "array"
      ? sortedChildren.slice(page * ARRAY_PAGE_SIZE, (page + 1) * ARRAY_PAGE_SIZE)
      : sortedChildren;

  return (
    <li className="tree-item">
      <div className="tree-row" style={{ "--depth": depth } as React.CSSProperties}>
        {expandable ? (
          <button
            className="expand-button"
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
            aria-expanded={isOpen}
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        ) : <span className="expand-spacer" />}
        <div className="node-main">
          <div className="node-title">
            <span className="node-name" title={node.name}>{node.name}</span>
            <span className="type-chip">{node.type}</span>
            {node.count !== undefined && <span className="count">{node.count}</span>}
          </div>
          <div className="node-path" title={node.path}>{node.path}</div>
        </div>
        <div className="node-metric">
          <span title={`${node.size.toLocaleString()} bytes`}>{formatBytes(node.size)}</span>
          <small>{percent.toFixed(1)}%</small>
          <MiniBar value={percent} />
        </div>
        <button
          className="copy-button"
          aria-label={`Copy path ${node.path}`}
          title="Copy path only"
          onClick={() => void copyPath(node.path, setCopied)}
        >
          {copied === node.path ? "✓" : "⧉"}
        </button>
      </div>
      {isOpen && (
        <>
          <ul role="group">
            {visibleChildren.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                parentBytes={node.size}
                depth={depth + 1}
                forceOpen={forceOpen}
                copied={copied}
                setCopied={setCopied}
              />
            ))}
          </ul>
          {node.type === "array" && pageCount > 1 && (
            <div className="pagination" style={{ marginLeft: `${depth * 14 + 30}px` }}>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Items {page * ARRAY_PAGE_SIZE + 1}–{Math.min((page + 1) * ARRAY_PAGE_SIZE, node.children.length)} of {node.children.length}</span>
              <button disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </li>
  );
}

export function MetadataTree({ nodes, totalBytes, searchActive }: TreeProps) {
  const [copied, setCopied] = useState("");
  return (
    <ul className="tree" role="tree" aria-label="Metadata structure">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          parentBytes={totalBytes}
          depth={0}
          forceOpen={searchActive}
          copied={copied}
          setCopied={setCopied}
        />
      ))}
    </ul>
  );
}
