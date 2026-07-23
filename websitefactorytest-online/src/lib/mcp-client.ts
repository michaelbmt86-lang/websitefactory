// ============================================================================
// MCP CLIENT — Chrome DevTools MCP stdio client
//
// Manages a singleton connection to the chrome-devtools-mcp server process.
// Spawns the server via npx on first use, reuses one Chrome instance across
// all extraction calls, and cleans up on shutdown.
// ============================================================================

import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let connectPromise: Promise<Client> | null = null;

// ---------------------------------------------------------------------------
// Ensure the MCP client is connected (lazy init, singleton)
// ---------------------------------------------------------------------------
async function getClient(): Promise<Client> {
  if (client) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      console.log("[mcp-client] Connecting to Chrome DevTools MCP server...");
      transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "chrome-devtools-mcp@latest", "--headless", "--isolated"],
        stderr: "ignore",
      });

      const c = new Client({ name: "website-factory", version: "1.0.0" });
      await c.connect(transport);
      client = c;
      console.log("[mcp-client] Connected successfully");
      return c;
    } catch (err) {
      console.error("[mcp-client] Connection failed:", err instanceof Error ? err.message : err);
      transport = null;
      throw err;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

// ---------------------------------------------------------------------------
// Reset idle timer — called after each extraction
// ---------------------------------------------------------------------------
function resetIdleTimer(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    void shutdown();
  }, IDLE_TIMEOUT_MS);
}

// ---------------------------------------------------------------------------
// Fetch rendered HTML from a URL via Chrome DevTools MCP
// ---------------------------------------------------------------------------
export async function fetchRenderedHtml(
  url: string,
  timeoutMs: number,
): Promise<string> {
  let c: Client;
  try {
    c = await getClient();
  } catch (err) {
    // Connection failed — reset stale state and rethrow
    client = null;
    transport = null;
    throw err;
  }
  resetIdleTimer();

  let pageId: number | undefined;

  try {
    // 1. Open a new tab and load the URL (waits for page load)
    console.log(`[mcp-client] Fetching rendered HTML: ${url} (timeout: ${timeoutMs}ms)`);
    const navResult = await c.callTool({
      name: "new_page",
      arguments: { url, timeout: timeoutMs },
    });

    // Extract pageId from the result text
    const navText =
      navResult.content &&
      Array.isArray(navResult.content) &&
      navResult.content.length > 0
        ? (navResult.content[0] as { type: string; text?: string }).text ?? ""
        : "";

    const pageIdMatch = navText.match(/pageId["\s:=]+(\d+)/i);
    if (pageIdMatch) {
      pageId = parseInt(pageIdMatch[1], 10);
    }

    // 2. Execute JS to get the rendered DOM
    const jsResult = await c.callTool({
      name: "evaluate_script",
      arguments: {
        function: "() => document.documentElement.outerHTML",
      },
    });

    const jsContent = jsResult.content;
    if (!jsContent || !Array.isArray(jsContent) || jsContent.length === 0) {
      throw new Error("evaluate_script returned empty content");
    }

    const html = (jsContent[0] as { type: string; text?: string }).text ?? "";
    if (!html || html.trim().length === 0) {
      throw new Error("Rendered HTML was empty");
    }

    console.log(`[mcp-client] Fetched ${html.length} bytes from ${url}`);
    return html;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[mcp-client] Failed to fetch ${url}: ${msg}`);
    throw err;
  } finally {
    // 3. Close the tab if we have a pageId
    if (pageId !== undefined) {
      try {
        await c.callTool({
          name: "close_page",
          arguments: { pageId },
        });
      } catch {
        // Best effort — tab cleanup failure is non-fatal
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Shutdown the MCP client and server process
// ---------------------------------------------------------------------------
export async function shutdown(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  const c = client;
  const t = transport;
  client = null;
  transport = null;
  connectPromise = null;

  if (c) {
    try {
      await c.close();
      console.log("[mcp-client] Client closed");
    } catch {
      // Best effort
    }
  }

  if (t) {
    try {
      await t.close();
      console.log("[mcp-client] Transport closed");
    } catch {
      // Best effort
    }
  }
}

// ---------------------------------------------------------------------------
// Register cleanup on process exit
// ---------------------------------------------------------------------------
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (client) {
      try {
        client.close();
      } catch {
        // Best effort — process is exiting
      }
    }
    if (transport) {
      try {
        transport.close();
      } catch {
        // Best effort — process is exiting
      }
    }
  });
}
