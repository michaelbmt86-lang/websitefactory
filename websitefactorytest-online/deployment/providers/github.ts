import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  GitHubProvider,
  GitHubRepoConfig,
  GitHubRepoResult,
  GitHubPushConfig,
  GitHubPushFolderConfig,
  GitHubWebhookConfig,
  GitHubWebhookResult,
  ProviderResult,
} from "./types";
import { timed, getGitHubToken } from "./utils";
import * as log from "./logger";

const PROVIDER = "github" as const;
const BASE_URL = "https://api.github.com";

interface GitHubApiResponse {
  message?: string;
  documentation_url?: string;
  [key: string]: unknown;
}

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".avif",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".zip", ".gz", ".tar", ".bz2", ".xz",
  ".mp4", ".mp3", ".webm", ".ogg", ".wav",
  ".pdf", ".wasm",
]);

function isBinaryFile(filePath: string, head: Buffer): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;
  const limit = Math.min(head.length, 8000);
  for (let i = 0; i < limit; i++) {
    if (head[i] === 0) return true;
  }
  return false;
}

async function ghFetch<T>(
  path: string,
  init: RequestInit,
  retries = 5,
): Promise<{ status: number; body: T & GitHubApiResponse }> {
  const token = getGitHubToken();
  const url = `${BASE_URL}${path}`;

  let attempt = 0;
  while (attempt <= retries) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });

    let body: T & GitHubApiResponse;
    try {
      body = await response.json() as T & GitHubApiResponse;
    } catch {
      throw new Error(`GitHub API returned non-JSON (HTTP ${response.status})`);
    }

    const isRetryable =
      response.status === 500 ||
      response.status === 503 ||
      response.status === 429 ||
      (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");

    if (isRetryable) {
      attempt++;
      if (attempt <= retries) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 30000)
          : Math.min(3000 * attempt, 15000);
        log.warn(PROVIDER, "ghFetch", `HTTP ${response.status} on ${path}, retrying in ${delay}ms (${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }

    return { status: response.status, body };
  }

  throw new Error(`GitHub API failed after ${retries} retries for ${path}`);
}

function handleGhError(status: number, body: GitHubApiResponse): never {
  const message = body.message ?? "Unknown error";

  switch (status) {
    case 400:
      throw new Error(`GitHub bad request (400): ${message}`);
    case 401:
      throw new Error(`GitHub authentication failed (401): ${message}`);
    case 403:
      throw new Error(`GitHub access denied (403): ${message}`);
    case 404:
      throw new Error(`GitHub resource not found (404): ${message}`);
    case 409:
      throw new Error(`GitHub conflict (409): ${message}`);
    case 422:
      throw new Error(`GitHub validation failed (422): ${message}`);
    case 429:
      throw new Error(`GitHub rate limited (429): ${message}`);
    default:
      if (status >= 500) {
        throw new Error(`GitHub server error (${status}): ${message}`);
      }
      throw new Error(`GitHub API error (${status}): ${message}`);
  }
}

async function createRepo(config: GitHubRepoConfig): Promise<ProviderResult<GitHubRepoResult>> {
  log.info(PROVIDER, "createRepo", `creating repo: ${config.name}`);

  return timed(PROVIDER, "createRepo", async () => {
    const payload: Record<string, unknown> = {
      name: config.name,
      description: config.description,
      private: config.private,
      auto_init: config.autoInit,
      default_branch: config.defaultBranch,
    };

    const { status, body } = await ghFetch<{ id: number; name: string; full_name: string; html_url: string; clone_url: string; ssh_url: string; default_branch: string }>(
      "/user/repos",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (status === 201) {
      log.info(PROVIDER, "createRepo", `repo created: ${body.full_name} (${body.id})`);
      return {
        repoId: body.id,
        name: body.name,
        fullName: body.full_name,
        url: body.html_url,
        cloneUrl: body.clone_url,
        sshUrl: body.ssh_url,
        defaultBranch: body.default_branch,
      };
    }

    handleGhError(status, body);
  });
}

async function pushCode(config: GitHubPushConfig): Promise<ProviderResult<void>> {
  log.info(PROVIDER, "pushCode", `pushing to ${config.repoFullName}:${config.branch}`);

  return timed(PROVIDER, "pushCode", async () => {
    const [owner, repo] = config.repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${config.repoFullName} (expected owner/repo)`);
    }

    const refResp = await ghFetch<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${config.branch}`,
      { method: "GET" },
    );

    if (refResp.status === 404) {
      throw new Error(`Branch "${config.branch}" not found in ${config.repoFullName}`);
    }

    if (refResp.status !== 200) {
      handleGhError(refResp.status, refResp.body);
    }

    const currentSha = refResp.body.object.sha;

    let treeSha: string | undefined;

    const gitCommitResp = await ghFetch<{ sha: string; tree: { sha: string } }>(
      `/repos/${owner}/${repo}/git/commits/${currentSha}`,
      { method: "GET" },
    );

    if (gitCommitResp.status === 200) {
      treeSha = gitCommitResp.body.tree.sha;
    } else {
      const restCommitResp = await ghFetch<{ commit: { tree: { sha: string } } }>(
        `/repos/${owner}/${repo}/commits/${currentSha}`,
        { method: "GET" },
      );

      if (restCommitResp.status === 200) {
        treeSha = restCommitResp.body.commit.tree.sha;
      }
    }

    if (!treeSha) {
      throw new Error(`Cannot read commit data for ${currentSha}`);
    }

    const commitPayload: Record<string, unknown> = {
      message: config.message,
      tree: treeSha,
      parents: [currentSha],
    };

    const newCommitResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify(commitPayload),
      },
    );

    if (newCommitResp.status !== 201) {
      handleGhError(newCommitResp.status, newCommitResp.body);
    }

    const updateRefPayload = {
      sha: newCommitResp.body.sha,
      force: false,
    };

    const updateRefResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/refs/heads/${config.branch}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateRefPayload),
      },
    );

    if (updateRefResp.status !== 200) {
      handleGhError(updateRefResp.status, updateRefResp.body);
    }

    log.info(PROVIDER, "pushCode", `pushed commit ${newCommitResp.body.sha.slice(0, 7)} to ${config.repoFullName}:${config.branch}`);
  });
}

async function pushFolderCode(config: GitHubPushFolderConfig): Promise<ProviderResult<void>> {
  log.info(PROVIDER, "pushFolderCode", `pushing folder "${config.folderName}" to ${config.repoFullName}:${config.branch}`);

  return timed(PROVIDER, "pushFolderCode", async () => {
    const [owner, repo] = config.repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${config.repoFullName} (expected owner/repo)`);
    }

    const refResp = await ghFetch<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${config.branch}`,
      { method: "GET" },
    );

    if (refResp.status === 404) {
      throw new Error(`Branch "${config.branch}" not found in ${config.repoFullName}`);
    }
    if (refResp.status !== 200) {
      handleGhError(refResp.status, refResp.body);
    }

    const currentSha = refResp.body.object.sha;

    const commitResp = await ghFetch<{ sha: string; tree: { sha: string } }>(
      `/repos/${owner}/${repo}/git/commits/${currentSha}`,
      { method: "GET" },
    );

    if (commitResp.status !== 200) {
      handleGhError(commitResp.status, commitResp.body);
    }

    const baseTreeSha = commitResp.body.tree.sha;

    interface TreeItem { path: string; mode: string; type: string; sha: string; }
    const existingFileMap = new Map<string, string>();

    const treeResp = await ghFetch<{ tree: TreeItem[]; truncated: boolean }>(
      `/repos/${owner}/${repo}/git/trees/${baseTreeSha}?recursive=1`,
      { method: "GET" },
    );

    if (treeResp.status === 200 && treeResp.body.tree) {
      for (const item of treeResp.body.tree) {
        if (item.type === "blob") {
          existingFileMap.set(item.path, item.sha);
        }
      }
      log.info(PROVIDER, "pushFolderCode", `existing tree: ${existingFileMap.size} blobs${treeResp.body.truncated ? " (truncated)" : ""}`);
    } else {
      log.info(PROVIDER, "pushFolderCode", "no existing tree found — full upload");
    }

    const sourceAbs = path.resolve(config.sourceDir);
    const entries: Array<{ path: string; content: string; contentBytes: Buffer; mode: "100644" | "100755" }> = [];

    function readDirRecursive(dir: string, prefix: string): void {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const rel = prefix ? `${prefix}/${item.name}` : item.name;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
          if (
            item.name === "node_modules" ||
            item.name === ".next" ||
            item.name === ".git" ||
            item.name === ".vercel" ||
            item.name === ".next-env.d.ts" ||
            item.name === ".aider" ||
            item.name === ".aider.tags.cache.v4" ||
            item.name === ".amazonq" ||
            item.name === ".augment" ||
            item.name === ".cursor" ||
            item.name === ".gemini" ||
            item.name === ".codex" ||
            item.name === ".continue" ||
            item.name === ".windsurf" ||
            item.name === ".opencode" ||
            item.name === ".agents" ||
            item.name === "reports" ||
            item.name === "workflows" ||
            item.name === "policies" ||
            item.name === "runtime"
          ) continue;
          readDirRecursive(full, rel);
        } else if (item.isFile()) {
          if (
            item.name === ".env" ||
            item.name.startsWith(".env.") ||
            item.name === ".dockerignore" ||
            item.name === ".gitignore" ||
            item.name === ".gitattributes" ||
            item.name === ".nvmrc" ||
            item.name === ".clinerules" ||
            item.name === ".windsurfrules" ||
            item.name === ".aider.conf.yml" ||
            item.name === ".aider.input.history" ||
            item.name.startsWith(".aider.") ||
            item.name === "_check_db.cjs" ||
            item.name === "_server.log" ||
            item.name === "_server_err.log" ||
            item.name === "test_hash_input.bin" ||
            item.name === "docker-compose.yml" ||
            item.name === "Dockerfile" ||
            item.name === "Dockerfile.dev" ||
            item.name === "CHANGELOG.md" ||
            item.name === "LICENSE"
          ) continue;
          const rawBytes = fs.readFileSync(full);
          const binary = isBinaryFile(item.name, rawBytes);
          const content = binary
            ? rawBytes.toString("utf8")
            : rawBytes.toString("utf8").replace(/\r\n/g, "\n");
          const contentBytes = binary ? rawBytes : Buffer.from(content, "utf8");
          entries.push({ path: `${config.folderName}/${rel}`, content, contentBytes, mode: "100644" });
        }
      }
    }

    readDirRecursive(sourceAbs, "");

    if (entries.length === 0) {
      throw new Error(`No files found in ${config.sourceDir}`);
    }

    const newFilePaths = new Set(entries.map((e) => e.path));
    let staleDeleted = 0;
    for (const [existingPath] of existingFileMap) {
      if (existingPath.startsWith(`${config.folderName}/`) && !newFilePaths.has(existingPath)) {
        existingFileMap.delete(existingPath);
        staleDeleted++;
      }
    }
    if (staleDeleted > 0) {
      log.info(PROVIDER, "pushFolderCode", `cleaned ${staleDeleted} stale files from "${config.folderName}"`);
    }

    log.info(PROVIDER, "pushFolderCode", `collecting ${entries.length} files from ${config.sourceDir}`);

    function gitBlobSha(contentBytes: Buffer): string {
      const header = Buffer.from(`blob ${contentBytes.length}\0`);
      return crypto.createHash("sha1").update(header).update(contentBytes).digest("hex");
    }

    const BLOB_DELAY_MS = 500;
    const BLOB_MAX_RETRIES = 3;
    const treeItems: TreeItem[] = [];
    let created = 0;
    let reused = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const localSha = gitBlobSha(entry.contentBytes);
      const existingSha = existingFileMap.get(entry.path);

      if (existingSha && existingSha === localSha) {
        treeItems.push({ path: entry.path, mode: entry.mode, type: "blob", sha: existingSha });
        reused++;
        continue;
      }

      let lastError: Error | undefined;
      for (let attempt = 1; attempt <= BLOB_MAX_RETRIES; attempt++) {
        const blobPayload = { content: entry.content, encoding: "utf-8" };

        const blobResp = await ghFetch<{ sha: string }>(
          `/repos/${owner}/${repo}/git/blobs`,
          {
            method: "POST",
            body: JSON.stringify(blobPayload),
          },
        );

        if (blobResp.status === 201) {
          treeItems.push({ path: entry.path, mode: entry.mode, type: "blob", sha: blobResp.body.sha });
          created++;
          lastError = undefined;
          break;
        }

        const isRateLimited =
          blobResp.status === 503 ||
          blobResp.status === 429 ||
          blobResp.status === 500;

        const errBody = blobResp.body;
        const errMsg = typeof errBody === "object" && errBody !== null && "message" in errBody
          ? String((errBody as { message: unknown }).message)
          : `HTTP ${blobResp.status}`;
        lastError = new Error(`blob ${entry.path}: ${errMsg}`);

        if (isRateLimited) {
          log.warn(PROVIDER, "pushFolderCode", `blob ${entry.path} rate limited (${blobResp.status}), will not blob-retry — ghFetch already retried`);
          break;
        }

        if (attempt < BLOB_MAX_RETRIES) {
          log.warn(PROVIDER, "pushFolderCode", `blob creation failed for ${entry.path} (${attempt}/${BLOB_MAX_RETRIES}): ${errMsg}, retrying...`);
          const retryDelay = Math.min(2000 * attempt, 10000);
          await new Promise((r) => setTimeout(r, retryDelay));
        }
      }

      if (lastError) {
        throw new Error(`Blob creation failed for ${entry.path} after ${BLOB_MAX_RETRIES} attempts: ${lastError.message}`);
      }

      if (i < entries.length - 1) {
        await new Promise((r) => setTimeout(r, BLOB_DELAY_MS));
      }
    }

    log.info(PROVIDER, "pushFolderCode", `blob stats: ${created} created, ${reused} reused, ${entries.length} total`);

    if (created === 0) {
      log.info(PROVIDER, "pushFolderCode", "no changes detected — skipping commit");
      return;
    }

    const treePayload = { base_tree: baseTreeSha, tree: treeItems };

    const newTreeResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify(treePayload),
      },
    );

    if (newTreeResp.status !== 201) {
      handleGhError(newTreeResp.status, newTreeResp.body);
    }

    const newTreeSha = newTreeResp.body.sha;

    const commitPayload = {
      message: config.message,
      tree: newTreeSha,
      parents: [currentSha],
    };

    const newCommitResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify(commitPayload),
      },
    );

    if (newCommitResp.status !== 201) {
      handleGhError(newCommitResp.status, newCommitResp.body);
    }

    const updateRefPayload = {
      sha: newCommitResp.body.sha,
      force: false,
    };

    const updateRefResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/refs/heads/${config.branch}`,
      {
        method: "PATCH",
        body: JSON.stringify(updateRefPayload),
      },
    );

    if (updateRefResp.status !== 200) {
      handleGhError(updateRefResp.status, updateRefResp.body);
    }

    log.info(PROVIDER, "pushFolderCode", `pushed ${created} changed files in "${config.folderName}" — commit ${newCommitResp.body.sha.slice(0, 7)}`);
  });
}

async function folderExists(repoFullName: string, branch: string, folderPath: string): Promise<ProviderResult<boolean>> {
  log.info(PROVIDER, "folderExists", `checking ${repoFullName}:${branch}/${folderPath}`);

  return timed(PROVIDER, "folderExists", async () => {
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${repoFullName} (expected owner/repo)`);
    }

    const { status } = await ghFetch<unknown>(
      `/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`,
      { method: "GET" },
    );

    if (status === 200) {
      return true;
    }
    if (status === 404) {
      return false;
    }

    handleGhError(status, { message: `Unexpected status ${status}` });
  });
}

async function createWebhook(config: GitHubWebhookConfig): Promise<ProviderResult<GitHubWebhookResult>> {
  log.info(PROVIDER, "createWebhook", `creating webhook for ${config.repoFullName}`);

  return timed(PROVIDER, "createWebhook", async () => {
    const [owner, repo] = config.repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${config.repoFullName} (expected owner/repo)`);
    }

    const payload: Record<string, unknown> = {
      name: "web",
      active: true,
      events: config.events,
      config: {
        url: config.url,
        content_type: "json",
        secret: config.secret ?? "",
        insecure_ssl: "0",
      },
    };

    const { status, body } = await ghFetch<{ id: number; url: string; active: boolean }>(
      `/repos/${owner}/${repo}/hooks`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (status === 201) {
      log.info(PROVIDER, "createWebhook", `webhook created: id=${body.id}`);
      return {
        webhookId: body.id,
        url: body.url,
        active: body.active,
      };
    }

    handleGhError(status, body);
  });
}

async function deleteRepo(repoFullName: string): Promise<ProviderResult<void>> {
  log.info(PROVIDER, "deleteRepo", `deleting repo: ${repoFullName}`);

  return timed(PROVIDER, "deleteRepo", async () => {
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${repoFullName} (expected owner/repo)`);
    }

    const { status, body } = await ghFetch<unknown>(
      `/repos/${owner}/${repo}`,
      { method: "DELETE" },
    );

    if (status === 204) {
      log.info(PROVIDER, "deleteRepo", `repo deleted: ${repoFullName}`);
      return;
    }

    handleGhError(status, body);
  });
}

async function repoExists(repoFullName: string): Promise<ProviderResult<boolean>> {
  log.info(PROVIDER, "repoExists", `checking: ${repoFullName}`);

  return timed(PROVIDER, "repoExists", async () => {
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      throw new Error(`Invalid repoFullName format: ${repoFullName} (expected owner/repo)`);
    }

    const { status } = await ghFetch<unknown>(
      `/repos/${owner}/${repo}`,
      { method: "GET" },
    );

    if (status === 200) {
      return true;
    }

    if (status === 404) {
      return false;
    }

    handleGhError(status, { message: `Unexpected status ${status}` });
  });
}

export const GitHub: GitHubProvider = {
  createRepo,
  pushCode,
  pushFolderCode,
  createWebhook,
  deleteRepo,
  repoExists,
  folderExists,
};

export default GitHub;
