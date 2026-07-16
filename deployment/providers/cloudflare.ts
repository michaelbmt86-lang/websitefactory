import type {
  CloudflareProvider,
  CloudflareDnsRecordConfig,
  CloudflareDnsRecordResult,
  CloudflareZoneResult,
  CloudflareSslConfig,
  CloudflareSslResult,
  ProviderResult,
} from "./types";
import { timed, getCloudflareToken } from "./utils";
import * as log from "./logger";

const PROVIDER = "cloudflare" as const;
const BASE_URL = "https://api.cloudflare.com/client/v4";

const SSL_MODE_MAP: Record<string, string> = {
  flexible: "flexible",
  strict: "strict",
  full: "full",
};

interface CloudflareApiResponse<T = unknown> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
  result_info?: { total_count: number; page: number; per_page: number };
}

async function cfFetch<T>(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: CloudflareApiResponse<T> }> {
  const token = getCloudflareToken();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  let body: CloudflareApiResponse<T>;
  try {
    body = await response.json() as CloudflareApiResponse<T>;
  } catch {
    throw new Error(`Cloudflare API returned non-JSON (HTTP ${response.status})`);
  }

  return { status: response.status, body };
}

function handleCfError(status: number, body: CloudflareApiResponse): never {
  const primaryError = body.errors?.[0];
  const code = primaryError?.code ?? 0;
  const message = primaryError?.message ?? "Unknown error";

  switch (status) {
    case 400:
      throw new Error(`Cloudflare bad request (400): [${code}] ${message}`);
    case 401:
      throw new Error(`Cloudflare authentication failed (401): [${code}] ${message}`);
    case 403:
      throw new Error(`Cloudflare access denied (403): [${code}] ${message}`);
    case 404:
      throw new Error(`Cloudflare resource not found (404): [${code}] ${message}`);
    case 409:
      throw new Error(`Cloudflare conflict (409): [${code}] ${message}`);
    case 429:
      throw new Error(`Cloudflare rate limited (429): [${code}] ${message}`);
    default:
      if (status >= 500) {
        throw new Error(`Cloudflare server error (${status}): [${code}] ${message}`);
      }
      throw new Error(`Cloudflare API error (${status}): [${code}] ${message}`);
  }
}

async function getZone(domain: string): Promise<ProviderResult<CloudflareZoneResult>> {
  log.info(PROVIDER, "getZone", `looking up zone for: ${domain}`);

  return timed(PROVIDER, "getZone", async () => {
    const { status, body } = await cfFetch<CloudflareZoneResult>(
      `/zones?name=${encodeURIComponent(domain)}`,
      { method: "GET" },
    );

    if (status !== 200 || !body.success) {
      handleCfError(status, body);
    }

    const zones = body.result as unknown as Array<{
      id: string;
      name: string;
      name_servers: string[];
      status: string;
    }>;
    const zone = Array.isArray(zones) ? zones[0] : zones;

    if (!zone) {
      throw new Error(`No zone found for domain: ${domain}`);
    }

    return {
      zoneId: zone.id,
      name: zone.name,
      nameServers: zone.name_servers,
      status: zone.status,
    };
  });
}

async function addDnsRecord(
  zoneId: string,
  config: CloudflareDnsRecordConfig,
): Promise<ProviderResult<CloudflareDnsRecordResult>> {
  log.info(PROVIDER, "addDnsRecord", `adding ${config.type} record ${config.name} -> ${config.content}`);

  return timed(PROVIDER, "addDnsRecord", async () => {
    const payload = {
      type: config.type,
      name: config.name,
      content: config.content,
      ttl: config.ttl,
      proxied: config.proxied,
    };

    const { status, body } = await cfFetch<CloudflareDnsRecordResult>(
      `/zones/${encodeURIComponent(zoneId)}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (status !== 200 || !body.success) {
      handleCfError(status, body);
    }

    const r = body.result as unknown as { id: string; type: string; name: string; content: string; ttl: number; proxied: boolean };
    return {
      recordId: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      proxied: r.proxied,
    };
  });
}

async function removeDnsRecord(zoneId: string, recordId: string): Promise<ProviderResult<void>> {
  log.info(PROVIDER, "removeDnsRecord", `removing record ${recordId} from zone ${zoneId}`);

  return timed(PROVIDER, "removeDnsRecord", async () => {
    const { status, body } = await cfFetch<unknown>(
      `/zones/${encodeURIComponent(zoneId)}/dns_records/${encodeURIComponent(recordId)}`,
      { method: "DELETE" },
    );

    if (status !== 200 || !body.success) {
      handleCfError(status, body);
    }
  });
}

async function listDnsRecords(zoneId: string): Promise<ProviderResult<CloudflareDnsRecordResult[]>> {
  log.info(PROVIDER, "listDnsRecords", `listing records for zone ${zoneId}`);

  return timed(PROVIDER, "listDnsRecords", async () => {
    const { status, body } = await cfFetch<CloudflareDnsRecordResult[]>(
      `/zones/${encodeURIComponent(zoneId)}/dns_records`,
      { method: "GET" },
    );

    if (status !== 200 || !body.success) {
      handleCfError(status, body);
    }

    const records = body.result as unknown as Array<{ id: string; type: string; name: string; content: string; ttl: number; proxied: boolean }>;
    if (!Array.isArray(records)) {
      throw new Error("Unexpected response format: expected array of DNS records");
    }

    return records.map((r) => ({
      recordId: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      proxied: r.proxied,
    }));
  });
}

async function configureSsl(config: CloudflareSslConfig): Promise<ProviderResult<CloudflareSslResult>> {
  log.info(PROVIDER, "configureSsl", `configuring SSL for ${config.domain} mode=${config.sslMode}`);

  return timed(PROVIDER, "configureSsl", async () => {
    const zone = await getZone(config.domain);
    if (!zone.success || !zone.data) {
      throw new Error(`Cannot configure SSL: zone lookup failed for ${config.domain}`);
    }

    const zoneId = zone.data.zoneId;
    const sslValue = SSL_MODE_MAP[config.sslMode] ?? config.sslMode;

    const { status, body } = await cfFetch<{ id: string; value: string; modified_on: string }>(
      `/zones/${encodeURIComponent(zoneId)}/settings/ssl`,
      {
        method: "PATCH",
        body: JSON.stringify({ value: sslValue }),
      },
    );

    if (status !== 200 || !body.success) {
      handleCfError(status, body);
    }

    const result = body.result;
    return {
      certificateId: result.id,
      status: result.value,
      expiresOn: result.modified_on,
    };
  });
}

export const Cloudflare: CloudflareProvider = {
  addDnsRecord,
  removeDnsRecord,
  getZone,
  configureSsl,
  listDnsRecords,
};

export default Cloudflare;
