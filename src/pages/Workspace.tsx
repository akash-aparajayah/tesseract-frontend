import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FolderOpenDot,
  FolderClosedIcon,
  Globe,
  Search,
  Wrench,
  ChevronUp,
  RotateCcwKeyIcon,
  Server,
  Copy,
  Cloud,
  Zap,
  Shield,
  Link,
  Check,
  Mail,
  MessageCircle,
  MessageSquare,
  ArrowRightFromLine,
} from "lucide-react";
import styles from "../styles/Workspace.module.css";
import workspaceIllustration from "../assets/illustration/Empty (1).gif";
import sidebarIllustration from "../assets/illustration/error.svg";
import { Skeleton } from "@/components/common/SkeletonLoader";
import { userAssignProjectEnv } from "@/services/projectApi";

// ---------- Types ----------
interface Credentials {
  [key: string]: string | undefined;
  endpoint?: string;
  description?: string;
  provider_name?: string;
  service_type?: string;
  service_description?: string;
}

interface Service {
  id: string;
  name: string;
  serviceEndpoint: string;
  sandbox: Credentials[];
  live: Credentials[];
}

interface Environment {
  public_id: string;
  environment_name: string;
  services: Service[];
  apiKeys?: ApiKey[];
}

interface Project {
  public_id: string;
  project_name: string;
  environments: Environment[];
}

interface ApiKey {
  public_id: string;
  prefix: string;
  mode: "SANDBOX" | "LIVE";
  expires_in_days: number;
  created_at: string;
  last_used_at: string | null;
  expiry_date: string;
  remaining_days: number;
  token_status: string;
  is_expired: boolean;
}

interface EnvToken {
  isGenerated: boolean;
  expiresAt: string | null;
  remainingDays?: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApiProject[];
}

interface ApiProject {
  public_id: string;
  project_name: string;
  environments: ApiEnvironment[];
}

interface ApiEnvironment {
  public_id: string;
  environment_name: string;
  services: ApiService[];
  api_keys: ApiKey[];
}

interface ApiService {
  id: string;
  service_endpoint: string;
  service_name: string;
  sandbox: Credentials[];
  live: Credentials[];
}

// ---------- Helper ----------
const formatExpiry = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 86400000,
  );
  if (daysLeft < 0) return "Expired";
  return `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
};

// Helper to get icon based on service type
const getServiceIcon = (serviceType?: string) => {
  switch (serviceType?.toLowerCase()) {
    case "sms":
      return <MessageCircle size={14} />;
    case "email":
      return <Mail size={14} />;
    case "whatsapp":
      return <MessageSquare size={14} />;
    default:
      return <Server size={14} />;
  }
};

// ---------- Credential Accordion (with provider name & description) ----------
interface CredentialAccordionProps {
  credential: Credentials;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

const CredentialAccordion = ({
  credential,
  index,
  isOpen,
  onToggle,
}: CredentialAccordionProps) => {
  // Fields to display inside the accordion (exclude meta fields)
  const displayFields = Object.entries(credential).filter(
    ([key]) =>
      ![
        "mode",
        "service_type",
        "provider_name",
        "service_description",
        "endpoint",
      ].includes(key),
  );

  const provider = credential.provider_name || "";
  const description = credential.service_description || "";
  const icon = getServiceIcon(credential.service_type);
  
  // Determine if we have both provider and description to show the arrow
  const showArrow = provider && description;

  return (
    <div className={styles.credentialAccordion}>
      <button className={styles.credentialAccordionHeader} onClick={onToggle}>
        <div className={styles.accordionHeaderLeft}>
          {icon}
          {provider && <span>{provider}</span>}
          {showArrow && <ArrowRightFromLine size={14} />}
          {description && <span>{description}</span>}
          {!provider && !description && <span>Credential #{index + 1}</span>}
        </div>
        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      <div
        className={`${styles.credentialAccordionContent} ${
          isOpen ? styles.open : ""
        }`}
      >
        {isOpen && displayFields.length > 0 && (
          <div className={styles.credentialFields}>
            {displayFields.map(([key, value]) => (
              <div key={key} className={styles.credentialRow}>
                <span className={styles.credLabel}>
                  {key.replace(/_/g, " ").toUpperCase()}
                </span>
                <code className={styles.credValue}>{String(value)}</code>
              </div>
            ))}
          </div>
        )}
        {isOpen && displayFields.length === 0 && (
          <div className={styles.noExtraFields}>No additional fields</div>
        )}
      </div>
    </div>
  );
};

// ---------- Main Workspace ----------
interface WorkspaceProps {
  userId?: string;
}

const Workspace = ({ userId: propUserId }: WorkspaceProps) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjectId, setExpandedId] = useState<string | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<{
    project: Project;
    environment: Environment;
  } | null>(null);
  const [selectedService, setSelectedSvc] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceType, setInstanceType] = useState<"sandbox" | "live">(
    "sandbox",
  );
  const [openAccordions, setOpenAccordions] = useState<{
    [k: number]: boolean;
  }>({});
  const [tokensMap, setTokensMap] = useState<Record<string, EnvToken>>({});

  // State for inline endpoint reveal
  const [showEndpointInline, setShowEndpointInline] = useState(false);
  const [rotateIcon, setRotateIcon] = useState(false);
  const [copied, setCopied] = useState(false);

  const getUserId = (): string => {
    if (propUserId) return propUserId;
    if (paramUserId) return paramUserId;
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.id) return payload.id;
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
    const storedId = localStorage.getItem("id");
    if (storedId) return storedId;
    return "";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = getUserId();
        if (!id) throw new Error("User ID not found. Please log in.");
        const response: ApiResponse = await userAssignProjectEnv(id);

        if (response?.success && Array.isArray(response.data)) {
          const transformedProjects: Project[] = response.data.map(
            (apiProject: ApiProject) => ({
              public_id: apiProject.public_id,
              project_name: apiProject.project_name,
              environments: apiProject.environments.map(
                (apiEnv: ApiEnvironment) => {
                 const transformedServices: Service[] = apiEnv.services.map(
                   (apiService: ApiService) => ({
                     id: apiService.id,
                     name: apiService.service_name,
                     serviceEndpoint: apiService.service_endpoint || "",
                     sandbox: apiService.sandbox || [],
                     live: apiService.live || [],
                   }),
                 );
                  return {
                    public_id: apiEnv.public_id,
                    environment_name: apiEnv.environment_name,
                    services: transformedServices,
                    apiKeys: apiEnv.api_keys || [],
                  };
                },
              ),
            }),
          );
          setProjects(transformedProjects);

          const tokenMap: Record<string, EnvToken> = {};
          response.data.forEach((apiProject: ApiProject) => {
            apiProject.environments.forEach((apiEnv: ApiEnvironment) => {
              const envId = apiEnv.public_id;
              (apiEnv.api_keys || []).forEach((key: ApiKey) => {
                const mode = key.mode.toLowerCase() as "sandbox" | "live";
                const isGenerated =
                  key.token_status === "Generated" && !key.is_expired;
                tokenMap[`${envId}_${mode}`] = {
                  isGenerated,
                  expiresAt: key.expiry_date,
                  remainingDays: key.remaining_days,
                };
              });
              if (!tokenMap[`${envId}_sandbox`])
                tokenMap[`${envId}_sandbox`] = {
                  isGenerated: false,
                  expiresAt: null,
                };
              if (!tokenMap[`${envId}_live`])
                tokenMap[`${envId}_live`] = {
                  isGenerated: false,
                  expiresAt: null,
                };
            });
          });
          setTokensMap(tokenMap);

          if (transformedProjects.length > 0) {
            const firstProject = transformedProjects[0];
            const firstEnv = firstProject.environments[0];
            if (firstEnv) {
              setExpandedId(firstProject.public_id);
              setSelectedEnv({ project: firstProject, environment: firstEnv });
              const firstService = firstEnv.services[0] || null;
              setSelectedSvc(firstService);
              setOpenAccordions({ 0: true });
            }
          }
        } else {
          setError(response?.message || "Invalid response format from server");
        }
      } catch (err: unknown) {
        console.error("API error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load projects. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propUserId, paramUserId]);

  const toggleProject = (id: string) =>
    setExpandedId((p) => (p === id ? null : id));

  const selectEnvironment = (project: Project, env: Environment) => {
    setSelectedEnv({ project, environment: env });
    const firstService = env.services[0] || null;
    setSelectedSvc(firstService);
    setInstanceType("sandbox");
    setOpenAccordions({ 0: true });
    setShowEndpointInline(false);
    setCopied(false);
  };

  const selectService = (svc: Service) => {
    setSelectedSvc(svc);
    setInstanceType("sandbox");
    setOpenAccordions({ 0: true });
    setShowEndpointInline(false);
    setCopied(false);
  };

  const handleInstanceChange = (type: "sandbox" | "live") => {
    setInstanceType(type);
    setOpenAccordions({ 0: true });
    setShowEndpointInline(false);
    setCopied(false);
  };

  const toggleAccordion = (i: number) =>
    setOpenAccordions((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleCableClick = () => {
    setRotateIcon(true);
    setShowEndpointInline((prev) => !prev);
    setCopied(false);
    setTimeout(() => setRotateIcon(false), 500);
  };

  const handleCopyEndpoint = async () => {
    if (selectedService?.serviceEndpoint) {
      await navigator.clipboard.writeText(selectedService.serviceEndpoint);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowEndpointInline(false);
      }, 1500);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.project_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSidebar}>
          <Skeleton height="44px" borderRadius="14px" />
          <div className={styles.loadingProjectsList}>
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
          </div>
        </div>
        <div className={styles.loadingMain}>
          <div className={styles.loadingTopbar}>
            <Skeleton height="24px" width="300px" borderRadius="6px" />
            <div className={styles.loadingChips}>
              <Skeleton width="100px" height="40px" borderRadius="999px" />
              <Skeleton width="100px" height="40px" borderRadius="999px" />
            </div>
          </div>
          <div className={styles.loadingContent}>
            <Skeleton height="120px" borderRadius="26px" />
            <div className={styles.loadingSegments}>
              <Skeleton width="120px" height="40px" borderRadius="999px" />
              <Skeleton width="120px" height="40px" borderRadius="999px" />
            </div>
            <Skeleton height="100px" borderRadius="18px" />
            <Skeleton height="100px" borderRadius="18px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.globalEmptyState}>
        <img src={workspaceIllustration} alt="Error" />
        <p>{error}</p>
      </div>
    );
  }

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

  const envId = selectedEnv?.environment.public_id ?? "";
  const sandboxToken = tokensMap[`${envId}_sandbox`] ?? {
    isGenerated: false,
    expiresAt: null,
  };
  const liveToken = tokensMap[`${envId}_live`] ?? {
    isGenerated: false,
    expiresAt: null,
  };
  const sandboxCount = selectedService?.sandbox.length ?? 0;
  const liveCount = selectedService?.live.length ?? 0;
  const credentials = selectedService
    ? instanceType === "sandbox"
      ? selectedService.sandbox
      : selectedService.live
    : [];

  const currentToken =
    instanceType === "sandbox" ? sandboxToken : liveToken;

  return (
    <div className={styles.container}>
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
                    className={`${styles.projectTitle} ${
                      isExpanded ? styles.expanded : ""
                    }`}
                    onClick={() => toggleProject(project.public_id)}
                  >
                    {isExpanded ? (
                      <FolderOpenDot size={18} />
                    ) : (
                      <FolderClosedIcon size={18} />
                    )}
                    <span title={project.project_name}>
                      {project.project_name
                        ? project.project_name.charAt(0).toUpperCase() +
                          project.project_name.slice(1)
                        : "No project"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </button>
                  <div
                    className={`${styles.environments} ${
                      isExpanded ? styles.open : ""
                    }`}
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
                            data-env={env.environment_name.toLowerCase()}
                            onClick={() => selectEnvironment(project, env)}
                          >
                            <Globe size={14} />
                            <span>
                              {env.environment_name
                                ? env.environment_name.charAt(0).toUpperCase() +
                                  env.environment_name.slice(1)
                                : "No environment"}
                            </span>
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

      <div className={styles.mainArea}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>
              {selectedEnv?.project?.project_name
                ? selectedEnv.project.project_name.charAt(0).toUpperCase() +
                  selectedEnv.project.project_name.slice(1)
                : "No project"}
            </span>{" "}
            <ChevronRight size={12} />
            <span className={styles.activeBreadcrumb}>
              <span>
                {selectedEnv?.environment?.environment_name
                  ? selectedEnv.environment.environment_name
                      .charAt(0)
                      .toUpperCase() +
                    selectedEnv.environment.environment_name.slice(1)
                  : "No environment"}
              </span>
            </span>
            <ChevronRight size={12} />
            <span className={styles.activeBreadcrumb}>
              {selectedService?.name || "No service"}
            </span>
          </div>
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
                  className={`${styles.serviceChip} ${
                    selectedService?.id === svc.id ? styles.activeService : ""
                  }`}
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
              <div className={styles.environmentBar}>
                <div className={styles.envLeftGroup}>
                  <div className={styles.instanceSegmentedControl}>
                    <button
                      data-env="sandbox"
                      className={`${styles.segmentedButton} ${
                        instanceType === "sandbox"
                          ? styles.segmentedActive
                          : ""
                      }`}
                      onClick={() => handleInstanceChange("sandbox")}
                    >
                      <Cloud size={14} />
                      <span>Sandbox</span>
                      <span className={styles.countBadge}>
                        {sandboxCount}
                      </span>
                    </button>
                    <button
                      data-env="live"
                      className={`${styles.segmentedButton} ${
                        instanceType === "live" ? styles.segmentedActive : ""
                      }`}
                      onClick={() => handleInstanceChange("live")}
                    >
                      <Zap size={14} />
                      <span>Live</span>
                      <span className={styles.countBadge}>{liveCount}</span>
                    </button>
                  </div>

                  <div className={styles.tokenSummary}>
                    <div className={styles.tokenKey}>
                      <RotateCcwKeyIcon size={14} />
                    </div>
                    <span className={styles.tokenSummaryLabel}>
                      {instanceType === "sandbox" ? "Sandbox" : "Live"} Token
                    </span>
                    {currentToken.isGenerated ? (
                      <>
                        <div
                          className={`${styles.tokenStatusBadge} ${styles.generated}`}
                        >
                          <Shield size={10} />
                          <span>Generated</span>
                        </div>
                        {formatExpiry(currentToken.expiresAt) && (
                          <span className={styles.tokenExpiry}>
                            Expires {formatExpiry(currentToken.expiresAt)}
                          </span>
                        )}
                      </>
                    ) : (
                      <div
                        className={`${styles.tokenStatusBadge} ${styles.notGenerated}`}
                      >
                        Not generated
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.envRightGroup}>
                  <div
                    className={`${styles.cableIcon} ${
                      rotateIcon ? styles.rotateIcon : ""
                    } ${!showEndpointInline ? styles.blinkingIcon : ""}`}
                    onClick={handleCableClick}
                    title="Endpoint"
                  >
                    <Link size={16} />
                  </div>
                </div>
              </div>

              {showEndpointInline && selectedService.serviceEndpoint && (
                <div className={styles.inlineEndpoint}>
                  <div className={styles.inlineEndpointValue}>
                    {selectedService.serviceEndpoint}
                  </div>
                  <button
                    className={`${styles.inlineCopyBtn} ${
                      copied ? styles.copied : ""
                    }`}
                    onClick={handleCopyEndpoint}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

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