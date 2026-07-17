// ============================================================================
// URL GRAPH BUILDER (Site Discovery Engine)
//
// Builds a complete URL graph with parent-child relationships, depth tracking,
// and discovery source attribution. Reusable — no site-specific logic.
// ============================================================================

import type {
  UrlGraph,
  UrlGraphNode,
  UrlGraphEdge,
  SiteUrl,
} from "@/types/discovery";

export function buildUrlGraph(urls: SiteUrl[], baseUrl: string): UrlGraph {
  const nodes: Record<string, UrlGraphNode> = {};
  const edges: UrlGraphEdge[] = [];
  let maxDepth = 0;

  const normalize = (url: string): string => {
    try {
      const parsed = new URL(url, baseUrl);
      let pathname = parsed.pathname;
      if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }
      return `${parsed.origin}${pathname}`;
    } catch {
      return url;
    }
  };

  // Build nodes
  for (const url of urls) {
    const normalizedUrl = normalize(url.url);
    const existing = nodes[normalizedUrl];

    if (existing) {
      // Merge discovery sources
      const source = url.discovered_by;
      if (!existing.discoveredBy.includes(source)) {
        existing.discoveredBy.push(source);
      }
      // Keep the shallower depth
      if (url.depth < existing.depth) {
        existing.depth = url.depth;
        existing.parent = url.parent_url ? normalize(url.parent_url) : null;
      }
      continue;
    }

    nodes[normalizedUrl] = {
      id: normalizedUrl,
      url: normalizedUrl,
      slug: url.slug,
      depth: url.depth,
      parent: url.parent_url ? normalize(url.parent_url) : null,
      pageType: url.page_type,
      status: url.status,
      priority: url.priority,
      discoveredBy: [url.discovered_by],
      children: [],
    };

    if (url.depth > maxDepth) maxDepth = url.depth;
  }

  // Build edges and children
  for (const node of Object.values(nodes)) {
    if (node.parent && nodes[node.parent]) {
      edges.push({
        source: node.parent,
        target: node.id,
        type: "content",
      });
      if (!nodes[node.parent].children.includes(node.id)) {
        nodes[node.parent].children.push(node.id);
      }
    }
  }

  return {
    nodes,
    root: normalize(baseUrl),
    maxDepth,
    totalUrls: Object.keys(nodes).length,
    edges,
  };
}

export function getNodeDepth(url: string, graph: UrlGraph): number {
  const node = graph.nodes[url];
  return node ? node.depth : -1;
}

export function getChildren(url: string, graph: UrlGraph): UrlGraphNode[] {
  const node = graph.nodes[url];
  if (!node) return [];
  return node.children
    .map(childId => graph.nodes[childId])
    .filter((n): n is UrlGraphNode => n !== undefined);
}

export function getParent(url: string, graph: UrlGraph): UrlGraphNode | null {
  const node = graph.nodes[url];
  if (!node || !node.parent) return null;
  return graph.nodes[node.parent] ?? null;
}

export function getSiblings(url: string, graph: UrlGraph): UrlGraphNode[] {
  const node = graph.nodes[url];
  if (!node || !node.parent) return [];
  return getChildren(node.parent, graph).filter(sibling => sibling.id !== url);
}

export function getNodesByType(type: string, graph: UrlGraph): UrlGraphNode[] {
  return Object.values(graph.nodes).filter(n => n.pageType === type);
}

export function getNodesByStatus(status: string, graph: UrlGraph): UrlGraphNode[] {
  return Object.values(graph.nodes).filter(n => n.status === status);
}

export function getNodesByDepth(depth: number, graph: UrlGraph): UrlGraphNode[] {
  return Object.values(graph.nodes).filter(n => n.depth === depth);
}

export function getPath(url: string, graph: UrlGraph): UrlGraphNode[] {
  const path: UrlGraphNode[] = [];
  let current: UrlGraphNode | undefined = graph.nodes[url];

  while (current) {
    path.unshift(current);
    current = current.parent ? graph.nodes[current.parent] : undefined;
  }

  return path;
}
