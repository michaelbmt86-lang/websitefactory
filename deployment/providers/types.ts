export type ProviderName = "github" | "vercel" | "cloudflare";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ProviderResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  provider: ProviderName;
  action: string;
  duration: number;
}

export interface ProviderOperationLog {
  provider: ProviderName;
  action: string;
  input: Record<string, unknown>;
  result: ProviderResult;
  timestamp: number;
}

export interface GitHubRepoConfig {
  name: string;
  description: string;
  private: boolean;
  autoInit: boolean;
  defaultBranch: string;
}

export interface GitHubRepoResult {
  repoId: number;
  name: string;
  fullName: string;
  url: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
}

export interface GitHubPushConfig {
  repoFullName: string;
  branch: string;
  message: string;
  sourceDir: string;
}

export interface GitHubWebhookConfig {
  repoFullName: string;
  events: string[];
  url: string;
  secret?: string;
}

export interface GitHubWebhookResult {
  webhookId: number;
  url: string;
  active: boolean;
}

export interface VercelProjectConfig {
  name: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  environmentVariables: Record<string, string>;
}

export interface VercelProjectResult {
  projectId: string;
  name: string;
  link: string;
}

export interface VercelDeployConfig {
  projectId: string;
  gitRef: string;
  name: string;
  target: "production" | "preview";
}

export interface VercelDeployResult {
  deploymentId: string;
  url: string;
  readyState: string;
  inspectorUrl: string;
}

export interface VercelDomainConfig {
  domain: string;
  projectId: string;
  redirect?: string;
}

export interface VercelDomainResult {
  domain: string;
  verified: boolean;
}

export interface CloudflareDnsRecordConfig {
  type: "A" | "CNAME" | "TXT" | "MX" | "AAAA";
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

export interface CloudflareDnsRecordResult {
  recordId: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
}

export interface CloudflareZoneConfig {
  domain: string;
  plan: string;
}

export interface CloudflareZoneResult {
  zoneId: string;
  name: string;
  nameServers: string[];
  status: string;
}

export interface CloudflareSslConfig {
  domain: string;
  minTlsVersion: "1.0" | "1.1" | "1.2" | "1.3";
  sslMode: "flexible" | "strict" | "full";
}

export interface CloudflareSslResult {
  certificateId: string;
  status: string;
  expiresOn: string;
}

export interface GitHubProvider {
  createRepo(config: GitHubRepoConfig): Promise<ProviderResult<GitHubRepoResult>>;
  pushCode(config: GitHubPushConfig): Promise<ProviderResult<void>>;
  createWebhook(config: GitHubWebhookConfig): Promise<ProviderResult<GitHubWebhookResult>>;
  deleteRepo(repoFullName: string): Promise<ProviderResult<void>>;
  repoExists(repoFullName: string): Promise<ProviderResult<boolean>>;
}

export interface VercelProvider {
  createProject(config: VercelProjectConfig): Promise<ProviderResult<VercelProjectResult>>;
  deploy(config: VercelDeployConfig): Promise<ProviderResult<VercelDeployResult>>;
  bindDomain(config: VercelDomainConfig): Promise<ProviderResult<VercelDomainResult>>;
  setEnvironmentVariables(projectId: string, vars: Record<string, string>): Promise<ProviderResult<{ set: number }>>;
  deleteProject(projectId: string): Promise<ProviderResult<void>>;
}

export interface CloudflareProvider {
  addDnsRecord(zoneId: string, config: CloudflareDnsRecordConfig): Promise<ProviderResult<CloudflareDnsRecordResult>>;
  removeDnsRecord(zoneId: string, recordId: string): Promise<ProviderResult<void>>;
  getZone(domain: string): Promise<ProviderResult<CloudflareZoneResult>>;
  configureSsl(config: CloudflareSslConfig): Promise<ProviderResult<CloudflareSslResult>>;
  listDnsRecords(zoneId: string): Promise<ProviderResult<CloudflareDnsRecordResult[]>>;
}
