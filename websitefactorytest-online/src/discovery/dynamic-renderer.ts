// ============================================================================
// DYNAMIC RENDERER
//
// Handles dynamic rendering concerns: waits for DOM stability, expands
// accordions/tabs/hidden sections, simulates "Read More" clicks, and
// extracts content from lazy-loaded components. Server-side simulation —
// no actual browser required.
// ============================================================================

export function prepareHtmlForExtraction(html: string): string {
  let processed = html;

  // Expand accordion content (remove display:none / height:0 constraints)
  processed = processed.replace(
    /style=["'][^"']*(?:display\s*:\s*none|height\s*:\s*0|visibility\s*:\s*hidden|overflow\s*:\s*hidden)[^"']*["']/gi,
    'style="display:block;height:auto;visibility:visible;overflow:visible"'
  );

  // Expand collapsed tab content
  processed = processed.replace(
    /class=["'][^"']*(?:tab-panel|tab-content|tab-pane)[^"']*["'][^>]*style=["'][^"']*(?:display\s*:\s*none|height\s*:\s*0)[^"']*["']/gi,
    (match) => match.replace(/style=["'][^"']*["']/i, 'style="display:block"')
  );

  // Remove aria-hidden on product sections
  processed = processed.replace(
    /(<div[^>]*class=["'][^"']*(?:product|description|specification|detail)[^"']*["'][^>]*)(?:aria-hidden=["']true["'])/gi,
    "$1"
  );

  // Expand noscript image tags (extract actual image URLs)
  processed = processed.replace(
    /<noscript[^>]*>([\s\S]*?)<\/noscript>/gi,
    (_, content: string) => {
      const imgs = content.matchAll(/<img[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi);
      let expanded = "";
      for (const img of imgs) {
        expanded += img[0] + "\n";
      }
      return expanded || content;
    }
  );

  // Expand lazy-loaded content markers
  processed = processed.replace(
    /data-content-lazy=["']([^"']+)["']/gi,
    (_, content: string) => `data-expanded="true">${content}`
  );

  return processed;
}

export function extractAccordionContent(html: string): { title: string; content: string }[] {
  const items: { title: string; content: string }[] = [];
  const seen = new Set<string>();

  // Pattern 1: h/button followed by div content
  const accordionBlocks = html.matchAll(
    /<(?:h[2-6]|button|summary)[^>]*class=["'][^"']*(?:accordion|toggle|collapsible|expand|faq-question)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[2-6]|button|summary)>\s*(?:<div|<p|<td)[^>]*class=["'][^"']*(?:accordion|toggle|collapsible|expand|faq-answer|content|body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p|td)>/gi
  );

  for (const match of accordionBlocks) {
    const title = stripTags(match[1]).trim();
    const content = stripTags(match[2]).trim();
    if (title && content && !seen.has(title)) {
      items.push({ title, content });
      seen.add(title);
    }
  }

  // Pattern 2: Details/Summary
  const detailsMatches = html.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/gi);
  for (const match of detailsMatches) {
    const summaryMatch = match[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const summaryText = summaryMatch ? stripTags(summaryMatch[1]).trim() : "";
    const contentStart = summaryMatch ? summaryMatch.index! + summaryMatch[0].length : 0;
    const content = stripTags(match[1].slice(contentStart)).trim();
    if (summaryText && content && !seen.has(summaryText)) {
      items.push({ title: summaryText, content });
      seen.add(summaryText);
    }
  }

  return items;
}

export function extractTabContent(html: string): { title: string; content: string }[] {
  const tabs: { title: string; content: string }[] = [];
  const seen = new Set<string>();

  // Tab buttons/links
  const tabButtons = [...html.matchAll(/<(?:a|button)[^>]*class=["'][^"']*(?:tab|tab-link|tab-button)[^"']*["'][^>]*data-(?:target|tab)=["']([^"']+)["'][^>]*>([\s\S]*?)<\/(?:a|button)>/gi)];

  for (const match of tabButtons) {
    const title = stripTags(match[2]).trim();
    const targetId = match[1];
    if (title && !seen.has(title)) {
      // Try to find the tab panel content
      const panelPattern = new RegExp(`<div[^>]*id=["']${escapeRegex(targetId)}["'][^>]*>([\\s\\S]*?)<\\/div>`, "i");
      const panelMatch = html.match(panelPattern);
      const content = panelMatch ? stripTags(panelMatch[1]).trim() : "";
      tabs.push({ title, content });
      seen.add(title);
    }
  }

  // Fallback: tab-like navigation links
  if (tabs.length === 0) {
    const navTabs = html.matchAll(/<li[^>]*class=["'][^"']*(?:tab-item|nav-tab)[^"']*["'][^>]*>\s*<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi);
    for (const match of navTabs) {
      const title = stripTags(match[1]).trim();
      if (title && !seen.has(title)) {
        tabs.push({ title, content: "" });
        seen.add(title);
      }
    }
  }

  return tabs;
}

// ============================================================================
// HELPERS
// ============================================================================

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
