import type {
  VercelProvider,
  VercelProjectConfig,
  VercelProjectResult,
  VercelDeployConfig,
  VercelDeployResult,
  VercelDomainConfig,
  VercelDomainResult,
  ProviderResult,
} from "./types";
import { timed, getVercelToken } from "./utils";
import * as log from "./logger";

const PROVIDER = "vercel" as const;
const BASE_URL = "https://api.vercel.com";

interface VercelErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

async function vercelFetch<T>(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: T & VercelErrorResponse }> {
  const token = getVercelToken();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  let body: T & VercelErrorResponse;
  try {
    body = await response.json() as T & VercelErrorResponse;
  } catch {
    if (response.status === 204) {
      return { status: 204, body: {} as T & VercelErrorResponse };
    }
    throw new Error(`Vercel API returned non-JSON (HTTP ${response.status})`);
  }

  return { status: response.status, body };
}

function handleVercelError(status: number, body: VercelErrorResponse): never {
  const msg = body.error?.message ?? "Unknown error";

  switch (status) {
    case 400:
      throw new Error(`Vercel bad request (400): ${msg}`);
    case 401:
      throw new Error(`Vercel authentication failed (401): ${msg}`);
    case 403:
      throw new Error(`Vercel access denied (403): ${msg}`);
    case 404:
      throw new Error(`Vercel resource not found (404): ${msg}`);
    case 409:
      throw new Error(`Vercel conflict (409): ${msg}`);
    case 429:
      throw new Error(`Vercel rate limited (429): ${msg}`);
    default:
      if (status >= 500) {
        throw new Error(`Vercel server error (${status}): ${msg}`);
      }
      throw new Error(`Vercel API error (${status}): ${msg}`);
  }
}

async function createProject(config: VercelProjectConfig): Promise<ProviderResult<VercelProjectResult>> {
  log.info(PROVIDER, "createProject", `creating project: ${config.name}`);

  return timed(PROVIDER, "createProject", async () => {
    const body: Record<string, string> = { name: config.name };
    if (config.framework) {
      body.framework = config.framework;
    }

    const { status, body: resp } = await vercelFetch<{ id: string; name: string; link?: unknown }>(
      "/v9/projects",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    if (status === 200 || status === 201) {
      log.info(PROVIDER, "createProject", `project created: ${resp.name} (${resp.id})`);
      return {
        projectId: resp.id,
        name: resp.name,
        link: resp.link ? JSON.stringify(resp.link) : "",
      };
    }

    if (status === 409) {
      log.info(PROVIDER, "createProject", `project "${config.name}" already exists — retrieving`);

      const getResp = await vercelFetch<{ id: string; name: string; link?: unknown }>(
        `/v9/projects/${encodeURIComponent(config.name)}`,
        { method: "GET" },
      );

      if (getResp.status === 200) {
        log.info(PROVIDER, "createProject", `retrieved existing project: ${getResp.body.name} (${getResp.body.id})`);
        return {
          projectId: getResp.body.id,
          name: getResp.body.name,
          link: getResp.body.link ? JSON.stringify(getResp.body.link) : "",
        };
      }

      handleVercelError(getResp.status, getResp.body);
    }

    handleVercelError(status, resp);
  });
}

async function deploy(config: VercelDeployConfig): Promise<ProviderResult<VercelDeployResult>> {
  log.info(PROVIDER, "deploy", `deploying project ${config.projectId} ref=${config.gitRef}`);

  return timed(PROVIDER, "deploy", async () => {
    const projResp = await vercelFetch<{ link?: { repoId?: number; type?: string } }>(
      `/v9/projects/${encodeURIComponent(config.projectId)}`,
      { method: "GET" },
    );

    const gitSource: Record<string, unknown> = {
      type: "github",
      ref: config.gitRef,
    };

    if (projResp.status === 200 && projResp.body.link?.repoId) {
      gitSource.repoId = projResp.body.link.repoId;
    }

    const targetMap: Record<string, string> = {
      production: "production",
      preview: "staging",
    };
    const deployTarget = targetMap[config.target] ?? config.target;

    const payload: Record<string, unknown> = {
      name: config.name,
      project: config.projectId,
      target: deployTarget,
      gitSource,
    };

    const { status, body } = await vercelFetch<{ id: string; url: string; readyState: string; inspectorUrl: string }>(
      "/v13/deployments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (status === 200 || status === 201) {
      log.info(PROVIDER, "deploy", `deployment created: ${body.id} (${body.url})`);
      return {
        deploymentId: body.id,
        url: body.url,
        readyState: body.readyState,
        inspectorUrl: body.inspectorUrl,
      };
    }

    handleVercelError(status, body);
  });
}

async function bindDomain(config: VercelDomainConfig): Promise<ProviderResult<VercelDomainResult>> {
  log.info(PROVIDER, "bindDomain", `binding domain ${config.domain} to project ${config.projectId}`);

  return timed(PROVIDER, "bindDomain", async () => {
    const payload: Record<string, unknown> = {
      name: config.domain,
    };

    if (config.redirect) {
      payload.redirect = config.redirect;
    }

    const { status, body } = await vercelFetch<{ name: string; verified: boolean }>(
      `/v9/projects/${encodeURIComponent(config.projectId)}/domains`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (status === 200 || status === 201) {
      log.info(PROVIDER, "bindDomain", `domain bound: ${body.name} (verified=${body.verified})`);
      return {
        domain: body.name,
        verified: body.verified,
      };
    }

    if (status === 409) {
      log.info(PROVIDER, "bindDomain", `domain ${config.domain} already in use — checking if on this project`);
      const existing = await vercelFetch<{ domains: Array<{ name: string; verified: boolean }> }>(
        `/v9/projects/${encodeURIComponent(config.projectId)}/domains`,
        { method: "GET" },
      );
      if (existing.status === 200) {
        const match = existing.body.domains?.find((d) => d.name === config.domain);
        if (match) {
          log.info(PROVIDER, "bindDomain", `domain already bound to this project (verified=${match.verified})`);
          return { domain: match.name, verified: match.verified };
        }
      }
      handleVercelError(status, body);
    }

    handleVercelError(status, body);
  });
}

async function setEnvironmentVariables(
  projectId: string,
  vars: Record<string, string>,
): Promise<ProviderResult<{ set: number }>> {
  log.info(PROVIDER, "setEnvVars", `setting ${Object.keys(vars).length} env vars for ${projectId}`);

  return timed(PROVIDER, "setEnvVars", async () => {
    const entries = Object.entries(vars);
    let created = 0;

    for (const [key, value] of entries) {
      const payload = {
        key,
        value,
        target: ["production", "preview", "development"],
        type: "encrypted" as const,
      };

      const { status, body } = await vercelFetch<{ key: string; value: string; id: string }>(
        `/v10/projects/${encodeURIComponent(projectId)}/env`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (status === 200 || status === 201) {
        created++;
        continue;
      }

      if (status === 409) {
        log.info(PROVIDER, "setEnvVars", `env var "${key}" already exists — skipping`);
        continue;
      }

      if (status === 400) {
        const errMsg = body.error?.message ?? "";
        if (errMsg.includes("already exists")) {
          log.info(PROVIDER, "setEnvVars", `env var "${key}" already exists — skipping`);
          continue;
        }
        handleVercelError(status, body);
      }

      handleVercelError(status, body);
    }

    log.info(PROVIDER, "setEnvVars", `set ${created}/${entries.length} env vars`);
    return { set: created };
  });
}

async function deleteProject(projectId: string): Promise<ProviderResult<void>> {
  log.info(PROVIDER, "deleteProject", `deleting project: ${projectId}`);

  return timed(PROVIDER, "deleteProject", async () => {
    const { status, body } = await vercelFetch<unknown>(
      `/v9/projects/${encodeURIComponent(projectId)}`,
      { method: "DELETE" },
    );

    if (status === 204) {
      log.info(PROVIDER, "deleteProject", `project deleted: ${projectId}`);
      return;
    }

    handleVercelError(status, body);
  });
}

export const Vercel: VercelProvider = {
  createProject,
  deploy,
  bindDomain,
  setEnvironmentVariables,
  deleteProject,
};

export default Vercel;
