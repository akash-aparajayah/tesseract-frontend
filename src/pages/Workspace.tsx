import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpenDot,
  FolderClosedIcon,
  Globe,
  Search,
  Wrench,
  ChevronUp,
  Key,
  Server,
  Copy,
  Check,
} from "lucide-react";
import styles from "../styles/Workspace.module.css";
import workspaceIllustration from "../assets/illustration/Empty (1).gif";
import sidebarIllustration from "../assets/illustration/error.svg";
import { Skeleton } from "@/components/common/SkeletonLoader";

// ---------- Types ----------
interface Credentials {
  apiKey?: string;
  apiSecret?: string;
  endpoint: string;
  description?: string;
  clientId?: string;
  tenantId?: string;
  region?: string;
  authUrl?: string;
  scope?: string;
  audience?: string;
  connectionString?: string;
  projectId?: string;
  [key: string]: string | undefined;
}

interface Service {
  id: string;
  name: string;
  sandbox: Credentials[];
  live: Credentials[];
}

interface Environment {
  public_id: string;
  environment_name: string;
  services: Service[];
}

interface Project {
  public_id: string;
  project_name: string;
  environments: Environment[];
}

// ---------- Mock Data (replace with API call) ----------
// ---------- Minimal Mock Data ----------
const projectsData: Project[] = [
  {
    public_id: "1",
    project_name: "Internal CRM Platform (Long Name Truncation Test)",
    environments: [
      {
        public_id: "env_1_dev",
        environment_name: "Development",
        services: [
          {
            id: "svc_1_dev_1",
            name: "User API",
            sandbox: [
              {
                apiKey: "sb_user_key",
                apiSecret: "sb_user_secret",
                endpoint: "https://sandbox-api.crm.com/user/v1",
                description: "User sandbox",
                clientId: "sb_client",
                tenantId: "sb_tenant",
                region: "us-east-1",
                authUrl: "https://sandbox-auth.crm.com/oauth",
                scope: "read write",
                audience: "sandbox-api",
                connectionString: "mongodb://sandbox:27017/users",
                projectId: "sb_proj_1",
              },
            ],
            live: [
              {
                apiKey: "live_user_key",
                apiSecret: "live_user_secret",
                endpoint: "https://api.crm.com/user/v1",
                description: "User live",
                clientId: "live_client",
                tenantId: "live_tenant",
                region: "us-east-1",
                authUrl: "https://auth.crm.com/oauth",
                scope: "read write admin",
                audience: "api",
                connectionString: "mongodb://live:27017/users",
                projectId: "live_proj_1",
              },
            ],
          },
          {
            id: "svc_1_dev_2",
            name: "Payment API",
            sandbox: [
              {
                apiKey: "sb_pay_key",
                apiSecret: "sb_pay_secret",
                endpoint: "https://sandbox-api.crm.com/pay/v1",
                description: "Payment sandbox",
                clientId: "sb_pay_client",
                tenantId: "sb_pay_tenant",
                region: "eu-west-1",
                authUrl: "https://sandbox-auth.crm.com/pay/token",
                scope: "charge refund",
                audience: "sandbox-pay",
                projectId: "sb_pay_proj",
              },
            ],
            live: [
              {
                apiKey: "live_pay_key",
                apiSecret: "live_pay_secret",
                endpoint: "https://api.crm.com/pay/v1",
                description: "Payment live",
                clientId: "live_pay_client",
                tenantId: "live_pay_tenant",
                region: "eu-west-1",
                authUrl: "https://auth.crm.com/pay/token",
                scope: "charge refund capture",
                audience: "api-pay",
                projectId: "live_pay_proj",
              },
            ],
          },
        ],
      },
      {
        public_id: "env_1_stg",
        environment_name: "Staging",
        services: [
          {
            id: "svc_1_stg_1",
            name: "User API",
            sandbox: [
              {
                apiKey: "stg_user_key",
                apiSecret: "stg_user_secret",
                endpoint: "https://staging-api.crm.com/user/v1",
                description: "Staging user",
                clientId: "stg_client",
                tenantId: "stg_tenant",
                region: "us-west-2",
                authUrl: "https://staging-auth.crm.com/oauth",
                scope: "read",
                audience: "staging-api",
                projectId: "stg_proj",
              },
            ],
            live: [
              {
                apiKey: "live_stg_user_key",
                apiSecret: "live_stg_user_secret",
                endpoint: "https://api.crm.com/user/v1",
                description: "Live (staging)",
                clientId: "live_client",
                tenantId: "live_tenant",
                region: "us-east-1",
                authUrl: "https://auth.crm.com/oauth",
                scope: "read write",
                audience: "api",
                projectId: "live_proj",
              },
            ],
          },
          {
            id: "svc_1_stg_2",
            name: "Notification API",
            sandbox: [
              {
                apiKey: "stg_notify_key",
                apiSecret: "stg_notify_secret",
                endpoint: "https://staging-api.crm.com/notify/v1",
                description: "Staging notification",
                clientId: "stg_notify_client",
                tenantId: "stg_notify_tenant",
                region: "us-west-2",
                authUrl: "https://staging-auth.crm.com/notify/token",
                scope: "send",
                audience: "staging-notify",
                projectId: "stg_notify_proj",
              },
            ],
            live: [
              {
                apiKey: "live_notify_key",
                apiSecret: "live_notify_secret",
                endpoint: "https://api.crm.com/notify/v1",
                description: "Live notification",
                clientId: "live_notify_client",
                tenantId: "live_notify_tenant",
                region: "us-east-1",
                authUrl: "https://auth.crm.com/notify/token",
                scope: "send receive",
                audience: "api-notify",
                projectId: "live_notify_proj",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    public_id: "2",
    project_name: "E-Commerce",
    environments: [
      {
        public_id: "env_2_dev",
        environment_name: "Development",
        services: [
          {
            id: "svc_2_dev_1",
            name: "Checkout API",
            sandbox: [
              {
                apiKey: "sb_checkout_key",
                apiSecret: "sb_checkout_secret",
                endpoint: "https://sandbox-api.shop.com/checkout/v1",
                description: "Checkout sandbox",
                clientId: "sb_check_client",
                tenantId: "sb_check_tenant",
                region: "ap-southeast-1",
                authUrl: "https://sandbox-auth.shop.com/checkout/token",
                scope: "cart order",
                audience: "sandbox-shop",
                projectId: "sb_check_proj",
              },
            ],
            live: [
              {
                apiKey: "live_checkout_key",
                apiSecret: "live_checkout_secret",
                endpoint: "https://api.shop.com/checkout/v1",
                description: "Checkout live",
                clientId: "live_check_client",
                tenantId: "live_check_tenant",
                region: "ap-southeast-1",
                authUrl: "https://auth.shop.com/checkout/token",
                scope: "cart order payment",
                audience: "api-shop",
                projectId: "live_check_proj",
              },
            ],
          },
        ],
      },
      {
        public_id: "env_2_prod",
        environment_name: "Production",
        services: [
          {
            id: "svc_2_prod_1",
            name: "Orders API",
            sandbox: [
              {
                apiKey: "sb_orders_key",
                apiSecret: "sb_orders_secret",
                endpoint: "https://sandbox-api.shop.com/orders/v1",
                description: "Orders sandbox",
                clientId: "sb_orders_client",
                tenantId: "sb_orders_tenant",
                region: "ap-southeast-1",
                authUrl: "https://sandbox-auth.shop.com/orders/token",
                scope: "read",
                audience: "sandbox-orders",
                projectId: "sb_orders_proj",
              },
            ],
            live: [
              {
                apiKey: "live_orders_key",
                apiSecret: "live_orders_secret",
                endpoint: "https://api.shop.com/orders/v1",
                description: "Orders live",
                clientId: "live_orders_client",
                tenantId: "live_orders_tenant",
                region: "ap-southeast-1",
                authUrl: "https://auth.shop.com/orders/token",
                scope: "read write",
                audience: "api-orders",
                projectId: "live_orders_proj",
              },
            ],
          },
        ],
      },
    ],
  },
];

// ---------- Token storage (minimal) ----------
interface EnvToken {
  token: string | null;
  expiresAt: string | null;
}

const environmentTokens: { [envId: string]: { sandbox: EnvToken; live: EnvToken } } = {
  "env_1_dev": {
    sandbox: {
      token: "generated",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
    live: {
      token: "generated",
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
  },
  "env_1_stg": {
    sandbox: { token: null, expiresAt: null },
    live: { token: null, expiresAt: null },
  },
  "env_2_dev": {
    sandbox: { token: null, expiresAt: null },
    live: { token: null, expiresAt: null },
  },
  "env_2_prod": {
    sandbox: { token: null, expiresAt: null },
    live: { token: null, expiresAt: null },
  },
};

const formatExpiry = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 86400000,
  );
  if (daysLeft < 0) return "Expired";
  return `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
};

// ---------- Token Details ----------
const EnvironmentTokenDetails = ({
  sandboxToken,
  liveToken,
  sandboxExpiry,
  liveExpiry,
}: any) => (
  <div className={styles.tokenSectionSingleLine}>
    <Key size={14} className={styles.tokenIcon} />
    <span className={styles.tokenSectionTitle}>Token Details</span>
    <div className={styles.tokenPair}>
      <span className={styles.tokenType}>Sandbox</span>
      <span className={styles.tokenStatus}>
        {sandboxToken ? (
          <>
            <code>{sandboxToken}</code>
            {sandboxExpiry && (
              <span className={`${styles.tokenValidity} ${styles.success}`}>
                {formatExpiry(sandboxExpiry)}
              </span>
            )}
          </>
        ) : (
          <span className={styles.tokenNotGenerated}>Not generated</span>
        )}
      </span>
    </div>
    <div className={styles.tokenPair}>
      <span className={styles.tokenType}>Live</span>
      <span className={styles.tokenStatus}>
        {liveToken ? (
          <>
            <code>{liveToken}</code>
            {liveExpiry && (
              <span className={`${styles.tokenValidity} ${styles.success}`}>
                {formatExpiry(liveExpiry)}
              </span>
            )}
          </>
        ) : (
          <span className={styles.tokenNotGenerated}>Not generated</span>
        )}
      </span>
    </div>
  </div>
);

// ---------- Credential Accordion ----------
const CredentialAccordion = ({ credential, index, isOpen, onToggle }: any) => {
  const [copied, setCopied] = useState(false);
  const fieldConfig = [
    { key: "apiKey", label: "API Key" },
    { key: "apiSecret", label: "API Secret" },
    { key: "clientId", label: "Client ID" },
    { key: "tenantId", label: "Tenant ID" },
    { key: "region", label: "Region" },
    { key: "authUrl", label: "Auth URL" },
    { key: "scope", label: "Scope" },
    { key: "audience", label: "Audience" },
    { key: "connectionString", label: "Connection String" },
    { key: "projectId", label: "Project ID" },
    { key: "description", label: "Description" },
  ];
  const existingFields = fieldConfig.filter((f) => credential[f.key]);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(credential.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={styles.credentialAccordion}>
      <button className={styles.credentialAccordionHeader} onClick={onToggle}>
        <div className={styles.accordionHeaderLeft}>
          <Server size={15} />
          <span>Credential #{index + 1}</span>
          {credential.description && (
            <span className={styles.credentialDescription}>
              — {credential.description}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      <div className={styles.credentialEndpointRow}>
        <span className={styles.endpointLabel}>Endpoint</span>
        <code className={styles.endpointValue}>{credential.endpoint}</code>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          title="Copy endpoint"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <div
        className={`${styles.credentialAccordionContent} ${isOpen ? styles.open : ""}`}
      >
        {isOpen && existingFields.length > 0 && (
          <div className={styles.credentialFields}>
            {existingFields.map((field) => (
              <div key={field.key} className={styles.credentialRow}>
                <span className={styles.credLabel}>{field.label}</span>
                <code className={styles.credValue}>
                  {credential[field.key]}
                </code>
              </div>
            ))}
          </div>
        )}
        {isOpen && existingFields.length === 0 && (
          <div className={styles.noExtraFields}>No additional fields</div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Workspace ----------
const Workspace = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjectId, setExpandedId] = useState<string | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<{
    project: Project;
    environment: Environment;
  } | null>(null);
  const [selectedService, setSelectedSvc] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [instanceType, setInstanceType] = useState<"sandbox" | "live">(
    "sandbox",
  );
  const [openAccordions, setOpenAccordions] = useState<{
    [k: number]: boolean;
  }>({});

  useEffect(() => {
    // Simulate API call – replace with real fetch
    setTimeout(() => {
      setProjects(projectsData);
      if (projectsData.length > 0) {
        const first = projectsData[0];
        const firstEnv = first.environments[0];
        setExpandedId(first.public_id);
        setSelectedEnv({ project: first, environment: firstEnv });
        setSelectedSvc(firstEnv.services[0] || null);
      }
      setLoading(false);
    }, 500);
  }, []);

  const toggleProject = (id: string) =>
    setExpandedId((p) => (p === id ? null : id));

  const selectEnvironment = (project: Project, env: Environment) => {
    setSelectedEnv({ project, environment: env });
    setSelectedSvc(env.services[0] || null);
    setInstanceType("sandbox");
    setOpenAccordions({});
  };

  const selectService = (svc: Service) => {
    setSelectedSvc(svc);
    setInstanceType("sandbox");
    setOpenAccordions({});
  };

  const toggleAccordion = (i: number) =>
    setOpenAccordions((p) => ({ ...p, [i]: !p[i] }));

  const filteredProjects = projects.filter((p) =>
    p.project_name.toLowerCase().includes(search.toLowerCase()),
  );

 // ✅ Use your custom Skeleton component with a layout that matches the workspace
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", width: "100%", background: "#f4f7fb" }}>
        {/* Sidebar skeleton */}
        <div style={{ width: 280, minWidth: 280, padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Skeleton height="44px" borderRadius="14px" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
          </div>
        </div>
        {/* Main area skeleton */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0" }}>
            <Skeleton height="24px" width="300px" borderRadius="6px" style={{ marginBottom: "12px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <Skeleton width="100px" height="40px" borderRadius="999px" />
              <Skeleton width="100px" height="40px" borderRadius="999px" />
            </div>
          </div>
          <div style={{ flex: 1, padding: "2rem" }}>
            <Skeleton height="120px" borderRadius="26px" style={{ marginBottom: "1rem" }} />
            <div style={{ display: "flex", gap: "12px", marginBottom: "1.5rem" }}>
              <Skeleton width="120px" height="40px" borderRadius="999px" />
              <Skeleton width="120px" height="40px" borderRadius="999px" />
            </div>
            <Skeleton height="100px" borderRadius="18px" style={{ marginBottom: "1rem" }} />
            <Skeleton height="100px" borderRadius="18px" />
          </div>
        </div>
      </div>
    );
  }

  // ----- Global empty state: no projects at all -----
  if (projects.length === 0) {
    return (
      <div className={styles.globalEmptyState}>
        <img src={workspaceIllustration} alt="No data" />
        <p>
          No projects have been assigned to you yet. Please contact your
          administrator for access.
        </p>
      </div>
    );
  }

  const serviceCount = selectedEnv?.environment.services.length ?? 0;
  const credentials = selectedService
    ? instanceType === "sandbox"
      ? selectedService.sandbox
      : selectedService.live
    : [];
  const envId = selectedEnv?.environment.public_id ?? "";
  const sandboxData = environmentTokens[envId]?.sandbox ?? {
    token: null,
    expiresAt: null,
  };
  const liveData = environmentTokens[envId]?.live ?? {
    token: null,
    expiresAt: null,
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.search}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.projectList}>
          {filteredProjects.length === 0 ? (
            <div className={styles.sidebarEmptyState}>
              <img src={sidebarIllustration} alt="No projects found" />
              <p>No projects match</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isExpanded = expandedProjectId === project.public_id;
              return (
                <div key={project.public_id} className={styles.projectItem}>
                  <button
                    className={`${styles.projectTitle} ${isExpanded ? styles.expanded : ""}`}
                    onClick={() => toggleProject(project.public_id)}
                  >
                    {isExpanded ? (
                      <FolderOpenDot size={18} />
                    ) : (
                      <FolderClosedIcon size={18} />
                    )}
                    <span>{project.project_name}</span>
                    {isExpanded ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </button>
                  <div
                    className={`${styles.environments} ${isExpanded ? styles.open : ""}`}
                  >
                    <div className={styles.environmentsInner}>
                      {project.environments.length === 0 ? (
                        <div className={styles.noEnvironmentsMessage}>
                          No environments
                        </div>
                      ) : (
                        project.environments.map((env) => (
                          <button
                            key={env.public_id}
                            className={`${styles.envButton} ${
                              selectedEnv?.environment.public_id ===
                              env.public_id
                                ? styles.activeEnv
                                : ""
                            }`}
                            onClick={() => selectEnvironment(project, env)}
                          >
                            <Globe size={13} />
                            <span>{env.environment_name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={styles.mainArea}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>{selectedEnv?.project.project_name || "No project"}</span>
            <ChevronRight size={12} />
            <span className={styles.activeBreadcrumb}>
              {selectedEnv?.environment.environment_name || "No environment"}
            </span>
            <ChevronRight size={12} />
            <span>{selectedService?.name || "No service"}</span>
          </div>
          {/* Divider line between breadcrumb and service chips */}
          <div className={styles.divider} />
          <div className={styles.serviceScroll}>
            {selectedEnv?.environment.services.length === 0 ? (
              <div className={styles.noServicesMessage}>
                No services in this environment
              </div>
            ) : (
              selectedEnv?.environment.services.map((svc) => (
                <button
                  key={svc.id}
                  className={`${styles.serviceChip} ${selectedService?.id === svc.id ? styles.activeService : ""}`}
                  onClick={() => selectService(svc)}
                >
                  <Wrench size={12} />
                  <span>{svc.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        <div className={styles.content}>
          {!selectedService ? (
            <div className={styles.mainEmptyState}>
              <img src={workspaceIllustration} alt="No service selected" />
              <p>Select a service to view credentials</p>
            </div>
          ) : (
            <>
              <EnvironmentTokenDetails
                sandboxToken={sandboxData.token}
                liveToken={liveData.token}
                sandboxExpiry={sandboxData.expiresAt}
                liveExpiry={liveData.expiresAt}
              />
              <div className={styles.instanceToggle}>
                <button
                  className={`${styles.instanceButton} ${instanceType === "sandbox" ? styles.activeInstance : ""}`}
                  onClick={() => setInstanceType("sandbox")}
                >
                  Sandbox{" "}
                  <span className={styles.countBadge}>{serviceCount}</span>
                </button>
                <button
                  className={`${styles.instanceButton} ${instanceType === "live" ? styles.activeInstance : ""}`}
                  onClick={() => setInstanceType("live")}
                >
                  Live <span className={styles.countBadge}>{serviceCount}</span>
                </button>
              </div>
              {credentials.length === 0 ? (
                <div className={styles.noCredentials}>
                  No credentials found for this instance
                </div>
              ) : (
                credentials.map((cred, idx) => (
                  <CredentialAccordion
                    key={idx}
                    credential={cred}
                    index={idx}
                    isOpen={openAccordions[idx] ?? false}
                    onToggle={() => toggleAccordion(idx)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;