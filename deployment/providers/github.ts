import type {
  GitHubProvider,
  GitHubRepoConfig,
  GitHubRepoResult,
  GitHubPushConfig,
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

async function ghFetch<T>(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: T & GitHubApiResponse }> {
  const token = getGitHubToken();
  const url = `${BASE_URL}${path}`;

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

  return { status: response.status, body };
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

    const currentCommit = await ghFetch<{ sha: string; commit: { tree: { sha: string } } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${config.branch}`,
      { method: "GET" },
    );

    if (currentCommit.status === 404) {
      throw new Error(`Branch "${config.branch}" not found in ${config.repoFullName}`);
    }

    if (currentCommit.status !== 200) {
      handleGhError(currentCommit.status, currentCommit.body);
    }

    const currentSha = currentCommit.body.sha;

    const commitResp = await ghFetch<{ sha: string; commit: { tree: { sha: string } } }>(
      `/repos/${owner}/${repo}/git/commits/${currentSha}`,
      { method: "GET" },
    );

    if (commitResp.status !== 200) {
      handleGhError(commitResp.status, commitResp.body);
    }

    const treeSha = (commitResp.body as { commit: { tree: { sha: string } } }).commit.tree.sha;

    const treePayload: Record<string, unknown> = {
      base_tree: treeSha,
      tree: [],
    };

    const treeResp = await ghFetch<{ sha: string }>(
      `/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify(treePayload),
      },
    );

    if (treeResp.status !== 201) {
      handleGhError(treeResp.status, treeResp.body);
    }

    const commitPayload: Record<string, unknown> = {
      message: config.message,
      tree: treeResp.body.sha,
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
  createWebhook,
  deleteRepo,
  repoExists,
};

export default GitHub;
